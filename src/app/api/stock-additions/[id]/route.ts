import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  updateStockAdditionSchema,
  type UpdateStockAdditionData,
} from "@/lib/validations/stock-management";

// GET /api/stock-additions/[id] - Get individual stock addition
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const additionId = parseInt(id);
    if (isNaN(additionId)) {
      return NextResponse.json(
        { error: "Invalid stock addition ID" },
        { status: 400 }
      );
    }

    const stockAddition = await prisma.stockAddition.findUnique({
      where: { id: additionId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
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

    if (!stockAddition) {
      return NextResponse.json(
        { error: "Stock addition not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ stockAddition });
  } catch (error) {
    console.error("Error fetching stock addition:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock addition" },
      { status: 500 }
    );
  }
}

// PUT /api/stock-additions/[id] - Update stock addition (limited fields)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has proper role
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const additionId = parseInt(id);
    if (isNaN(additionId)) {
      return NextResponse.json(
        { error: "Invalid stock addition ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData: UpdateStockAdditionData =
      updateStockAdditionSchema.parse(body);

    // Check if stock addition exists
    const existingStockAddition = await prisma.stockAddition.findUnique({
      where: { id: additionId },
      select: { id: true, quantity: true, productId: true },
    });

    if (!existingStockAddition) {
      return NextResponse.json(
        { error: "Stock addition not found" },
        { status: 404 }
      );
    }

    // Validate supplier if provided
    if (validatedData.supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: validatedData.supplierId },
        select: { id: true, isActive: true },
      });

      if (!supplier) {
        return NextResponse.json(
          { error: "Supplier not found" },
          { status: 404 }
        );
      }

      if (!supplier.isActive) {
        return NextResponse.json(
          { error: "Supplier is inactive" },
          { status: 400 }
        );
      }
    }

    // Update in transaction to handle stock quantity changes
    const result = await prisma.$transaction(async (tx) => {
      // If quantity is being updated, adjust product stock
      if (
        validatedData.quantity &&
        validatedData.quantity !== existingStockAddition.quantity
      ) {
        const quantityDifference =
          validatedData.quantity - existingStockAddition.quantity;

        await tx.product.update({
          where: { id: existingStockAddition.productId },
          data: {
            stock: {
              increment: quantityDifference,
            },
          },
        });
      }

      // Calculate new total cost if cost per unit or quantity changed
      const updateData: any = { ...validatedData };
      if (validatedData.costPerUnit || validatedData.quantity) {
        const currentRecord = await tx.stockAddition.findUnique({
          where: { id: additionId },
          select: { costPerUnit: true, quantity: true },
        });

        const newCostPerUnit =
          validatedData.costPerUnit || Number(currentRecord!.costPerUnit);
        const newQuantity = validatedData.quantity || currentRecord!.quantity;
        updateData.totalCost = newCostPerUnit * newQuantity;
      }

      // Update stock addition
      const updatedStockAddition = await tx.stockAddition.update({
        where: { id: additionId },
        data: updateData,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              stock: true,
            },
          },
          supplier: {
            select: {
              id: true,
              name: true,
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

      return updatedStockAddition;
    });

    return NextResponse.json({
      stockAddition: result,
      message: "Stock addition updated successfully",
    });
  } catch (error) {
    console.error("Error updating stock addition:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update stock addition" },
      { status: 500 }
    );
  }
}

// DELETE /api/stock-additions/[id] - Delete stock addition (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can delete stock additions
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const additionId = parseInt(id);
    if (isNaN(additionId)) {
      return NextResponse.json(
        { error: "Invalid stock addition ID" },
        { status: 400 }
      );
    }

    // Check if stock addition exists
    const stockAddition = await prisma.stockAddition.findUnique({
      where: { id: additionId },
      select: {
        id: true,
        quantity: true,
        productId: true,
        product: { select: { name: true } },
      },
    });

    if (!stockAddition) {
      return NextResponse.json(
        { error: "Stock addition not found" },
        { status: 404 }
      );
    }

    // Delete in transaction and adjust product stock
    await prisma.$transaction(async (tx) => {
      // Reduce product stock by the added quantity
      await tx.product.update({
        where: { id: stockAddition.productId },
        data: {
          stock: {
            decrement: stockAddition.quantity,
          },
        },
      });

      // Delete stock addition
      await tx.stockAddition.delete({
        where: { id: additionId },
      });
    });

    return NextResponse.json({
      message: `Stock addition deleted successfully. Reduced ${stockAddition.product.name} stock by ${stockAddition.quantity} units.`,
    });
  } catch (error) {
    console.error("Error deleting stock addition:", error);
    return NextResponse.json(
      { error: "Failed to delete stock addition" },
      { status: 500 }
    );
  }
}
