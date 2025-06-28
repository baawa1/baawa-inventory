import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ZodError } from "zod";
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

    // Build Prisma where clause
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

    // Get stock additions with relations
    const [stockAdditions, totalCount] = await Promise.all([
      prisma.stockAddition.findMany({
        where,
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
        orderBy: {
          [validatedQuery.sortBy === "createdAt"
            ? "createdAt"
            : validatedQuery.sortBy]: validatedQuery.sortOrder,
        },
        skip,
        take: validatedQuery.limit,
      }),
      prisma.stockAddition.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / validatedQuery.limit);

    return NextResponse.json({
      stockAdditions: stockAdditions || [],
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: totalCount,
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
    console.log("Received body:", body); // Debug log

    const validatedData: CreateStockAdditionData =
      createStockAdditionSchema.parse(body);
    console.log("Validated data:", validatedData); // Debug log

    // Execute all operations in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if product exists
      console.log(
        "Checking if product exists for ID:",
        validatedData.productId
      );
      const product = await tx.product.findUnique({
        where: { id: validatedData.productId },
        select: { id: true, name: true, stock: true, cost: true },
      });

      console.log("Found product:", product);

      if (!product) {
        throw new Error("Product not found");
      }

      // Check if supplier exists (if provided)
      if (validatedData.supplierId) {
        const supplier = await tx.supplier.findUnique({
          where: { id: validatedData.supplierId },
          select: { id: true, isActive: true },
        });

        if (!supplier) {
          throw new Error("Supplier not found");
        }

        if (!supplier.isActive) {
          throw new Error("Supplier is inactive");
        }
      }

      // Calculate total cost
      const totalCost = validatedData.quantity * validatedData.costPerUnit;

      // Create stock addition record
      const stockAddition = await tx.stockAddition.create({
        data: {
          productId: validatedData.productId,
          supplierId: validatedData.supplierId,
          createdById: parseInt(session.user.id),
          quantity: validatedData.quantity,
          costPerUnit: validatedData.costPerUnit,
          totalCost: totalCost,
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
            select: { id: true, name: true },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      // Calculate weighted average cost
      const currentValue = product.stock * Number(product.cost);
      const additionValue = validatedData.quantity * validatedData.costPerUnit;
      const newStock = product.stock + validatedData.quantity;
      const newAverageCost =
        newStock > 0
          ? (currentValue + additionValue) / newStock
          : validatedData.costPerUnit;

      // Update product stock and cost
      await tx.product.update({
        where: { id: validatedData.productId },
        data: {
          stock: newStock,
          cost: newAverageCost,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: "STOCK_ADDITION",
          entityType: "PRODUCT",
          entityId: validatedData.productId.toString(),
          userId: parseInt(session.user.id),
          newValues: {
            productName: product.name,
            quantityAdded: validatedData.quantity,
            costPerUnit: validatedData.costPerUnit,
            previousStock: product.stock,
            newStock: newStock,
            previousCost: product.cost,
            newAverageCost: newAverageCost,
            totalCost,
            referenceNo: validatedData.referenceNo,
          },
        },
      });

      return {
        stockAddition,
        productName: product.name,
        newStock,
      };
    });

    return NextResponse.json(
      {
        stockAddition: result.stockAddition,
        message: `Successfully added ${validatedData.quantity} units to ${result.productName}. New stock: ${result.newStock}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating stock addition:", error);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      console.error("Validation errors:", error.errors);
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: error.errors
            .map((err: any) => `${err.path.join(".")}: ${err.message}`)
            .join(", "),
        },
        { status: 400 }
      );
    }

    // Handle custom transaction errors
    if (error instanceof Error) {
      if (error.message === "Product not found") {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }
      if (error.message === "Supplier not found") {
        return NextResponse.json(
          { error: "Supplier not found" },
          { status: 404 }
        );
      }
      if (error.message === "Supplier is inactive") {
        return NextResponse.json(
          { error: "Supplier is inactive" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create stock addition" },
      { status: 500 }
    );
  }
}
