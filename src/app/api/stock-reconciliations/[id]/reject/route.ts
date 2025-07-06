import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendReconciliationNotification } from "@/lib/notifications/stock-reconciliation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
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

    const { reason, notes } = await request.json();

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    // Check if reconciliation exists and can be rejected
    const reconciliation = await prisma.stockReconciliation.findUnique({
      where: { id: reconciliationId },
      select: {
        id: true,
        status: true,
        title: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!reconciliation) {
      return NextResponse.json(
        { error: "Stock reconciliation not found" },
        { status: 404 }
      );
    }

    // Can only reject pending reconciliations
    if (reconciliation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending reconciliations can be rejected" },
        { status: 400 }
      );
    }

    // Update reconciliation status to rejected
    const updatedReconciliation = await prisma.stockReconciliation.update({
      where: { id: reconciliationId },
      data: {
        status: "REJECTED",
        approvedById: parseInt(session.user.id),
        approvedAt: new Date(),
        notes: `REJECTED: ${reason}${notes ? `\n${notes}` : ""}`,
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

    // Send notification about the rejected reconciliation
    try {
      await sendReconciliationNotification({
        type: "RECONCILIATION_REJECTED",
        reconciliationId: updatedReconciliation.id,
        reconciliationTitle: updatedReconciliation.title,
        createdBy: updatedReconciliation.createdBy,
        approvedBy: updatedReconciliation.approvedBy || undefined,
        comments: reason,
      });
    } catch (notificationError) {
      console.error(
        "Failed to send rejection notification:",
        notificationError
      );
      // Don't fail the whole operation if notification fails
    }

    return NextResponse.json({
      message: "Stock reconciliation rejected successfully",
      reconciliation: updatedReconciliation,
    });
  } catch (error) {
    console.error("Error rejecting stock reconciliation:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
