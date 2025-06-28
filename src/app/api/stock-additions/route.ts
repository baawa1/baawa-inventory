import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withRole } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";
import {
  createStockAdditionSchema,
  stockAdditionQuerySchema,
  type CreateStockAdditionData,
  type StockAdditionQuery,
} from "@/lib/validations/stock-management";

// GET /api/stock-additions - List stock additions with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams: Record<string, unknown> = {};

    // Parse query parameters
    for (const [key, value] of searchParams) {
      if (
        key === "productId" ||
        key === "supplierId" ||
        key === "createdBy" ||
        key === "page" ||
        key === "limit"
      ) {
        queryParams[key] = parseInt(value);
      } else {
        queryParams[key] = value;
      }
    }

    const validatedQuery = stockAdditionQuerySchema.parse(queryParams);

    // Build where clause
    const where: any = {};
    if (validatedQuery.productId) where.productId = validatedQuery.productId;
    if (validatedQuery.supplierId) where.supplierId = validatedQuery.supplierId;
    if (validatedQuery.createdBy) where.createdById = validatedQuery.createdBy;
    if (validatedQuery.startDate || validatedQuery.endDate) {
      where.purchaseDate = {};
      if (validatedQuery.startDate)
        where.purchaseDate.gte = new Date(validatedQuery.startDate);
      if (validatedQuery.endDate)
        where.purchaseDate.lte = new Date(validatedQuery.endDate);
    }

    // Calculate pagination
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;

    // Get total count
    const total = await prisma.stockAddition.count({ where });

    // Get stock additions
    const stockAdditions = await prisma.stockAddition.findMany({
      where,
      skip,
      take: validatedQuery.limit,
      orderBy: {
        [validatedQuery.sortBy]: validatedQuery.sortOrder,
      },
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

    const totalPages = Math.ceil(total / validatedQuery.limit);

    return NextResponse.json({
      stockAdditions,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total,
        totalPages,
        hasNext: validatedQuery.page < totalPages,
        hasPrev: validatedQuery.page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching stock additions:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock additions" },
      { status: 500 }
    );
  }
}

// POST /api/stock-additions - Create new stock addition
export async function POST(request: NextRequest) {
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

  try {
    const body = await request.json();
    const validatedData: CreateStockAdditionData =
      createStockAdditionSchema.parse(body);

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
      select: { id: true, name: true, stock: true, cost: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if supplier exists (if provided)
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

    // Calculate total cost (will be recalculated by trigger)
    const totalCost = validatedData.quantity * validatedData.costPerUnit;

    // Create stock addition in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create stock addition record
      const stockAddition = await tx.stockAddition.create({
        data: {
          productId: validatedData.productId,
          supplierId: validatedData.supplierId,
          createdById: parseInt(session.user.id),
          quantity: validatedData.quantity,
          costPerUnit: validatedData.costPerUnit,
          totalCost,
          purchaseDate: validatedData.purchaseDate
            ? new Date(validatedData.purchaseDate)
            : new Date(),
          notes: validatedData.notes,
          referenceNo: validatedData.referenceNo,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              stock: true,
              cost: true,
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

      // Get current product stock for weighted average cost calculation
      const currentProduct = await tx.product.findUnique({
        where: { id: validatedData.productId },
        select: { stock: true, cost: true },
      });

      if (!currentProduct) {
        throw new Error("Product not found during update");
      }

      // Calculate weighted average cost
      const currentValue = currentProduct.stock * Number(currentProduct.cost);
      const additionValue = validatedData.quantity * validatedData.costPerUnit;
      const newStock = currentProduct.stock + validatedData.quantity;
      const newAverageCost =
        newStock > 0
          ? (currentValue + additionValue) / newStock
          : validatedData.costPerUnit;

      // Update product stock and cost
      const updatedProduct = await tx.product.update({
        where: { id: validatedData.productId },
        data: {
          stock: newStock,
          cost: newAverageCost, // Use weighted average cost
        },
        select: {
          id: true,
          name: true,
          stock: true,
          cost: true,
        },
      });

      // Create audit log for inventory value change
      const supplierName = validatedData.supplierId
        ? (
            await tx.supplier.findUnique({
              where: { id: validatedData.supplierId },
              select: { name: true },
            })
          )?.name
        : null;

      await tx.auditLog.create({
        data: {
          action: "STOCK_ADDITION",
          entityType: "PRODUCT",
          entityId: validatedData.productId.toString(),
          userId: parseInt(session.user.id),
          newValues: {
            productName: updatedProduct.name,
            quantityAdded: validatedData.quantity,
            costPerUnit: validatedData.costPerUnit,
            previousStock: currentProduct.stock,
            newStock: updatedProduct.stock,
            previousCost: Number(currentProduct.cost),
            newAverageCost: newAverageCost,
            totalCost,
            supplier: supplierName,
            referenceNo: validatedData.referenceNo,
          },
        },
      });

      return { stockAddition, updatedProduct };
    });

    return NextResponse.json(
      {
        stockAddition: result.stockAddition,
        message: `Successfully added ${validatedData.quantity} units to ${product.name}. New stock: ${result.updatedProduct.stock}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating stock addition:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create stock addition" },
      { status: 500 }
    );
  }
}
