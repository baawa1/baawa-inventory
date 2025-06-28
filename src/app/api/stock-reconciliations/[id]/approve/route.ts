import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { sendReconciliationNotification } from "@/lib/notifications/stock-reconciliation";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reconciliationId = parseInt(params.id);
    if (isNaN(reconciliationId)) {
      return NextResponse.json(
        { error: "Invalid reconciliation ID" },
        { status: 400 }
      );
    }

    await request.json(); // Optional approval notes

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get reconciliation with items
      const reconciliation = await tx.stockReconciliation.findUnique({
        where: { id: reconciliationId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  stock: true,
                },
              },
            },
          },
        },
      });

      if (!reconciliation) {
        throw new Error("Stock reconciliation not found");
      }

      // Can only approve pending reconciliations
      if (reconciliation.status !== "PENDING") {
        throw new Error("Only pending reconciliations can be approved");
      }

      // Update product stock levels based on discrepancies
      for (const item of reconciliation.items) {
        const discrepancy = item.physicalCount - item.systemCount;
        if (discrepancy !== 0) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: item.physicalCount, // Set to physical count
            },
          });

          // Create stock adjustment record for audit trail
          await tx.stockAdjustment.create({
            data: {
              productId: item.productId,
              type: discrepancy > 0 ? "INCREASE" : "DECREASE",
              quantity: Math.abs(discrepancy),
              previousStock: item.systemCount,
              newStock: item.physicalCount,
              reason:
                item.discrepancyReason || "Stock reconciliation adjustment",
              notes: `Stock reconciliation #${reconciliation.id} - ${item.discrepancyReason || "Inventory count correction"}`,
              userId: parseInt(session.user.id),
            },
          });
        }
      }

      // Update reconciliation status
      const updatedReconciliation = await tx.stockReconciliation.update({
        where: { id: reconciliationId },
        data: {
          status: "APPROVED",
          approvedById: parseInt(session.user.id),
          approvedAt: new Date(),
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  stock: true,
                },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          approvedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return updatedReconciliation;
    });

    // Send notification about the approved reconciliation
    try {
      await sendReconciliationNotification({
        type: "RECONCILIATION_APPROVED",
        reconciliationId: result.id,
        reconciliationTitle: result.title,
        createdBy: result.createdBy,
        approvedBy: result.approvedBy || undefined,
      });
    } catch (notificationError) {
      console.error("Failed to send approval notification:", notificationError);
      // Don't fail the whole operation if notification fails
    }

    return NextResponse.json({
      message: "Stock reconciliation approved successfully",
      reconciliation: result,
    });
  } catch (error) {
    console.error("Error approving stock reconciliation:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
