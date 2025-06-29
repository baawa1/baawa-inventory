import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createStockAdjustmentSchema,
  stockAdjustmentQuerySchema,
} from "@/lib/validations/stock-adjustment";
import { withApiRateLimit } from "@/lib/rate-limit";

// GET /api/stock-adjustments - List stock adjustments with optional filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Convert search params to proper types for validation
    const queryParams = {
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 10,
      productId: searchParams.get("productId")
        ? parseInt(searchParams.get("productId")!)
        : undefined,
      userId: searchParams.get("userId")
        ? parseInt(searchParams.get("userId")!)
        : undefined,
      type: searchParams.get("type") || undefined,
      fromDate: searchParams.get("fromDate") || undefined,
      toDate: searchParams.get("toDate") || undefined,
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
    };

    // Validate query parameters
    const validatedQuery = stockAdjustmentQuerySchema.parse(queryParams);
    const {
      page,
      limit,
      productId,
      userId,
      type,
      fromDate,
      toDate,
      sortBy,
      sortOrder,
    } = validatedQuery;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build where clause for Prisma
    const where: any = {};

    // Apply filters
    if (productId) {
      where.productId = productId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (type) {
      where.type = type;
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === "createdAt") {
      orderBy.createdAt = sortOrder;
    } else {
      orderBy.createdAt = sortOrder; // default fallback
    }

    // Execute queries in parallel for better performance
    const [stockAdjustments, totalCount] = await Promise.all([
      prisma.stockAdjustment.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          product: {
            select: { id: true, name: true, sku: true, category: true },
          },
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      prisma.stockAdjustment.count({ where }),
    ]);

    return NextResponse.json({
      data: stockAdjustments,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/stock-adjustments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/stock-adjustments - Create a new stock adjustment
export const POST = withApiRateLimit(async function (request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createStockAdjustmentSchema.parse(body);

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current product stock
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
      select: { id: true, name: true, stock: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Calculate new stock based on adjustment type
    let newStock = product.stock;
    let adjustmentQuantity = validatedData.quantity;

    switch (validatedData.type) {
      case "INCREASE":
      case "RETURN":
        // For increase, quantity should be positive
        if (adjustmentQuantity <= 0) {
          return NextResponse.json(
            {
              error:
                "Quantity must be positive for increase/return adjustments",
            },
            { status: 400 }
          );
        }
        newStock = product.stock + adjustmentQuantity;
        break;
      case "DECREASE":
      case "DAMAGE":
      case "TRANSFER":
        // For decrease, quantity should be positive (representing amount to remove)
        if (adjustmentQuantity <= 0) {
          return NextResponse.json(
            {
              error:
                "Quantity must be positive for decrease/damage/transfer adjustments",
            },
            { status: 400 }
          );
        }
        if (product.stock < adjustmentQuantity) {
          return NextResponse.json(
            {
              error: `Insufficient stock. Current stock: ${product.stock}, Requested adjustment: ${adjustmentQuantity}`,
            },
            { status: 400 }
          );
        }
        newStock = product.stock - adjustmentQuantity;
        break;
      case "RECOUNT":
        // For recount, the quantity represents the new total stock
        if (adjustmentQuantity < 0) {
          return NextResponse.json(
            { error: "New stock count cannot be negative" },
            { status: 400 }
          );
        }
        newStock = adjustmentQuantity;
        adjustmentQuantity = newStock - product.stock; // Calculate the difference
        break;
      default:
        return NextResponse.json(
          { error: "Invalid adjustment type" },
          { status: 400 }
        );
    }

    // Use Prisma transaction to create adjustment and update stock
    const result = await prisma.$transaction(async (tx) => {
      // Create the stock adjustment record
      const stockAdjustment = await tx.stockAdjustment.create({
        data: {
          productId: validatedData.productId,
          userId: validatedData.userId,
          type: validatedData.type,
          quantity: adjustmentQuantity,
          previousStock: product.stock,
          newStock: newStock,
          reason: validatedData.reason,
          notes: validatedData.notes,
        },
        include: {
          product: {
            select: { id: true, name: true, sku: true, category: true },
          },
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      // Update product stock immediately (not pending approval in this simpler version)
      await tx.product.update({
        where: { id: validatedData.productId },
        data: { stock: newStock },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: "STOCK_ADJUSTMENT",
          entityType: "PRODUCT",
          entityId: validatedData.productId.toString(),
          userId: validatedData.userId,
          oldValues: {
            stock: product.stock,
          },
          newValues: {
            stock: newStock,
            adjustmentType: validatedData.type,
            adjustmentQuantity: adjustmentQuantity,
            reason: validatedData.reason,
          },
        },
      });

      return stockAdjustment;
    });

    return NextResponse.json(
      {
        data: result,
        message: "Stock adjustment created successfully",
        stockChange: {
          productId: validatedData.productId,
          productName: product.name,
          previousStock: product.stock,
          newStock: newStock,
          adjustmentQuantity: adjustmentQuantity,
          adjustmentType: validatedData.type,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/stock-adjustments:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
});
