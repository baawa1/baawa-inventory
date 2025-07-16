import { auth } from "../../../../auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ZodError } from "zod";
import { hasPermission } from "@/lib/auth/roles";
import {
  createStockAdditionSchema,
  stockAdditionQuerySchema,
  type CreateStockAdditionData,
} from "@/lib/validations/stock-management";

// GET /api/stock-additions - List stock additions with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
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

    // Add search functionality
    if (validatedQuery.search) {
      where.OR = [
        {
          product: {
            name: {
              contains: validatedQuery.search,
              mode: "insensitive",
            },
          },
        },
        {
          product: {
            sku: {
              contains: validatedQuery.search,
              mode: "insensitive",
            },
          },
        },
        {
          referenceNo: {
            contains: validatedQuery.search,
            mode: "insensitive",
          },
        },
      ];
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
              category: {
                select: {
                  name: true,
                },
              },
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

    // Format the response for the StockHistoryList component
    const formattedStockAdditions = stockAdditions.map((addition) => ({
      id: addition.id.toString(),
      product: {
        id: addition.product.id.toString(),
        name: addition.product.name,
        sku: addition.product.sku,
        category: addition.product.category?.name || "Uncategorized",
      },
      quantity: addition.quantity,
      costPerUnit: Number(addition.costPerUnit),
      totalCost: Number(addition.totalCost),
      supplier: addition.supplier
        ? {
            id: addition.supplier.id.toString(),
            name: addition.supplier.name,
          }
        : null,
      purchaseDate: addition.purchaseDate
        ? addition.purchaseDate.toISOString()
        : new Date().toISOString(),
      referenceNumber: addition.referenceNo,
      notes: addition.notes,
      createdBy: {
        id: addition.createdBy.id.toString(),
        name: `${addition.createdBy.firstName} ${addition.createdBy.lastName}`.trim(),
      },
      createdAt: addition.createdAt
        ? addition.createdAt.toISOString()
        : new Date().toISOString(),
      // Calculate previous stock (current stock - quantity added)
      previousStock: Math.max(0, addition.product.stock - addition.quantity),
      newStock: addition.product.stock,
    }));

    const totalPages = Math.ceil(totalCount / validatedQuery.limit);

    return NextResponse.json({
      data: formattedStockAdditions,
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
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user has proper role
  if (!hasPermission(session.user.role, "INVENTORY_WRITE")) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const validatedData: CreateStockAdditionData =
      createStockAdditionSchema.parse(body);

    // Ensure user ID is properly parsed
    const userId = parseInt(session.user.id);
    if (isNaN(userId)) {
      throw new Error("Invalid user ID in session");
    }

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
      if (validatedData.supplierId && validatedData.supplierId > 0) {
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
          supplierId:
            validatedData.supplierId && validatedData.supplierId > 0
              ? validatedData.supplierId
              : undefined,
          createdById: userId,
          quantity: validatedData.quantity,
          costPerUnit: validatedData.costPerUnit,
          totalCost: totalCost,
          purchaseDate: validatedData.purchaseDate
            ? new Date(validatedData.purchaseDate)
            : new Date(),
          notes: validatedData.notes || undefined,
          referenceNo: validatedData.referenceNo || undefined,
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

      // Create audit log using Prisma
      try {
        await tx.auditLog.create({
          data: {
            action: "STOCK_ADDITION",
            table_name: "PRODUCT",
            record_id: validatedData.productId,
            user_id: userId,
            new_values: {
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
      } catch (auditError) {
        console.warn("Failed to create audit log:", auditError);
        // Don't fail the entire transaction for audit log issues
      }

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
