import { auth } from "../../../../../../auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendReconciliationNotification } from "@/lib/notifications/stock-reconciliation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const reconciliationId = parseInt(id);
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

          // Stock reconciliation serves as the audit trail for these changes
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
