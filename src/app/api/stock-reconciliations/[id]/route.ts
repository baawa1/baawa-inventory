import { auth } from "../../../../../auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateStockReconciliationSchema } from "@/lib/validations/stock-management";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
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

    const reconciliation = await prisma.stockReconciliation.findUnique({
      where: {
        id: reconciliationId,
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

    if (!reconciliation) {
      return NextResponse.json(
        { error: "Stock reconciliation not found" },
        { status: 404 }
      );
    }

    // Check permissions - users can only see their own reconciliations unless they're admin
    if (
      session.user.role !== "ADMIN" &&
      reconciliation.createdById !== parseInt(session.user.id)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Transform the response to ensure proper number types
    const transformedReconciliation = {
      ...reconciliation,
      items: reconciliation.items.map((item) => ({
        ...item,
        estimatedImpact:
          item.estimatedImpact !== null && item.estimatedImpact !== undefined
            ? Number(item.estimatedImpact)
            : null,
      })),
    };

    return NextResponse.json({
      success: true,
      message: "Stock reconciliation retrieved successfully",
      data: transformedReconciliation,
    });
  } catch (error) {
    console.error("Error fetching stock reconciliation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
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

    const body = await request.json();
    const validationResult = updateStockReconciliationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { title, description, items } = validationResult.data;

    // Check if reconciliation exists and is editable
    const existingReconciliation = await prisma.stockReconciliation.findUnique({
      where: { id: reconciliationId },
      select: {
        id: true,
        status: true,
        createdById: true,
      },
    });

    if (!existingReconciliation) {
      return NextResponse.json(
        { error: "Stock reconciliation not found" },
        { status: 404 }
      );
    }

    // Check permissions - only creator or admin can edit
    if (
      session.user.role !== "ADMIN" &&
      existingReconciliation.createdById !== parseInt(session.user.id)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only draft reconciliations can be edited
    if (existingReconciliation.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft reconciliations can be edited" },
        { status: 400 }
      );
    }

    // Update reconciliation in transaction
    const updatedReconciliation = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.stockReconciliationItem.deleteMany({
        where: { reconciliationId },
      });

      // Get products for cost calculation
      const productIds = items?.map((item) => item.productId) || [];
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, cost: true },
      });

      // Update reconciliation and create new items
      return await tx.stockReconciliation.update({
        where: { id: reconciliationId },
        data: {
          title,
          description,
          items: {
            create: items?.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              const discrepancy = item.physicalCount - item.systemCount;

              // Calculate estimated impact with proper null handling
              let estimatedImpact = item.estimatedImpact;
              if (estimatedImpact === null || estimatedImpact === undefined) {
                const productCost = product ? Number(product.cost) || 0 : 0;
                estimatedImpact = discrepancy * productCost;

                // Ensure we don't store NaN
                if (isNaN(estimatedImpact)) {
                  estimatedImpact = 0;
                }
              }

              return {
                productId: item.productId,
                systemCount: item.systemCount,
                physicalCount: item.physicalCount,
                discrepancy,
                discrepancyReason: item.discrepancyReason,
                estimatedImpact,
                notes: item.notes,
              };
            }),
          },
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
        },
      });
    });

    return NextResponse.json({
      reconciliation: {
        ...updatedReconciliation,
        items: updatedReconciliation.items.map((item) => ({
          ...item,
          estimatedImpact:
            item.estimatedImpact !== null && item.estimatedImpact !== undefined
              ? Number(item.estimatedImpact)
              : null,
        })),
      },
    });
  } catch (error) {
    console.error("Error updating stock reconciliation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check if reconciliation exists
    const existingReconciliation = await prisma.stockReconciliation.findUnique({
      where: { id: reconciliationId },
      select: { id: true, status: true },
    });

    if (!existingReconciliation) {
      return NextResponse.json(
        { error: "Stock reconciliation not found" },
        { status: 404 }
      );
    }

    // Don't allow deletion of approved reconciliations
    if (existingReconciliation.status === "APPROVED") {
      return NextResponse.json(
        { error: "Cannot delete approved reconciliations" },
        { status: 400 }
      );
    }

    // Delete reconciliation (cascade will handle items)
    await prisma.stockReconciliation.delete({
      where: { id: reconciliationId },
    });

    return NextResponse.json({
      message: "Stock reconciliation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting stock reconciliation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
