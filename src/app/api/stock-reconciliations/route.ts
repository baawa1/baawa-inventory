import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  createStockReconciliationSchema,
  stockReconciliationQuerySchema,
  type CreateStockReconciliationData,
  type StockReconciliationQuery,
} from "@/lib/validations/stock-management";

// GET /api/stock-reconciliations - List stock reconciliations with filtering
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
        key === "createdBy" ||
        key === "approvedBy" ||
        key === "page" ||
        key === "limit"
      ) {
        queryParams[key] = parseInt(value);
      } else {
        queryParams[key] = value;
      }
    }

    const validatedQuery = stockReconciliationQuerySchema.parse(queryParams);

    // Build where clause
    const where: any = {};
    if (validatedQuery.status) where.status = validatedQuery.status;
    if (validatedQuery.createdBy) where.createdById = validatedQuery.createdBy;
    if (validatedQuery.approvedBy)
      where.approvedById = validatedQuery.approvedBy;
    if (validatedQuery.startDate || validatedQuery.endDate) {
      where.createdAt = {};
      if (validatedQuery.startDate)
        where.createdAt.gte = new Date(validatedQuery.startDate);
      if (validatedQuery.endDate)
        where.createdAt.lte = new Date(validatedQuery.endDate);
    }

    // Calculate pagination
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;

    // Get total count
    const total = await prisma.stockReconciliation.count({ where });

    // Get stock reconciliations
    const reconciliations = await prisma.stockReconciliation.findMany({
      where,
      skip,
      take: validatedQuery.limit,
      orderBy: {
        [validatedQuery.sortBy]: validatedQuery.sortOrder,
      },
      include: {
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
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(total / validatedQuery.limit);

    return NextResponse.json({
      reconciliations,
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
    console.error("Error fetching stock reconciliations:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock reconciliations" },
      { status: 500 }
    );
  }
}

// POST /api/stock-reconciliations - Create new stock reconciliation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has proper role
    if (!["ADMIN", "MANAGER", "STAFF"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData: CreateStockReconciliationData =
      createStockReconciliationSchema.parse(body);

    // Validate all products exist and get current stock counts
    const productIds = validatedData.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true, stock: true, cost: true },
    });

    if (products.length !== productIds.length) {
      const missingIds = productIds.filter(
        (id) => !products.find((p) => p.id === id)
      );
      return NextResponse.json(
        { error: `Products not found: ${missingIds.join(", ")}` },
        { status: 404 }
      );
    }

    // Create reconciliation in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create reconciliation record
      const reconciliation = await tx.stockReconciliation.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          notes: validatedData.notes,
          createdById: parseInt(session.user.id),
          status: "DRAFT",
        },
      });

      // Create reconciliation items
      const itemsData = validatedData.items.map((item) => {
        const product = products.find((p) => p.id === item.productId)!;
        const discrepancy = item.physicalCount - item.systemCount;
        const estimatedImpact =
          item.estimatedImpact || discrepancy * Number(product.cost);

        return {
          reconciliationId: reconciliation.id,
          productId: item.productId,
          systemCount: item.systemCount,
          physicalCount: item.physicalCount,
          discrepancy,
          discrepancyReason: item.discrepancyReason,
          estimatedImpact,
          notes: item.notes,
        };
      });

      const createdItems = await tx.stockReconciliationItem.createMany({
        data: itemsData,
      });

      // Get the complete reconciliation with items for response
      const completeReconciliation = await tx.stockReconciliation.findUnique({
        where: { id: reconciliation.id },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
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
        },
      });

      return completeReconciliation;
    });

    return NextResponse.json(
      {
        reconciliation: result,
        message: `Stock reconciliation "${validatedData.title}" created successfully with ${validatedData.items.length} items`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating stock reconciliation:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create stock reconciliation" },
      { status: 500 }
    );
  }
}
