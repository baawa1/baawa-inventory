import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSaleSchema, saleQuerySchema } from "@/lib/validations/sale";

// GET /api/sales - List sales transactions with optional filtering and pagination
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
      search: searchParams.get("search") || undefined,
      paymentStatus: searchParams.get("paymentStatus") || undefined,
      paymentMethod: searchParams.get("paymentMethod") || undefined,
      userId: searchParams.get("userId")
        ? parseInt(searchParams.get("userId")!)
        : undefined,
      fromDate: searchParams.get("fromDate") || undefined,
      toDate: searchParams.get("toDate") || undefined,
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
    };

    // Validate query parameters
    const validatedQuery = saleQuerySchema.parse(queryParams);
    const {
      page,
      limit,
      search,
      paymentStatus,
      paymentMethod,
      userId,
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
    if (search) {
      where.OR = [
        { transactionCode: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (userId) {
      where.cashierId = userId;
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
    } else if (sortBy === "total") {
      orderBy.total = sortOrder;
    } else if (sortBy === "transactionCode") {
      orderBy.transactionCode = sortOrder;
    } else {
      orderBy.createdAt = sortOrder; // default fallback
    }

    // Execute queries in parallel for better performance
    const [salesTransactions, totalCount] = await Promise.all([
      prisma.salesTransaction.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          cashier: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          salesItems: {
            include: {
              product: {
                select: { id: true, name: true, sku: true },
              },
            },
          },
        },
      }),
      prisma.salesTransaction.count({ where }),
    ]);

    return NextResponse.json({
      data: salesTransactions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/sales:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/sales - Create a new sales transaction
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSaleSchema.parse(body);

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate transaction code
    const timestamp = Date.now();
    const transactionCode = `TXN-${timestamp}`;

    // Use Prisma transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Calculate totals from items
      let subtotal = 0;
      const itemsWithProducts = [];

      // First, validate all products and calculate totals
      for (const item of validatedData.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, stock: true, price: true },
        });

        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for product ${product.name}. Available: ${product.stock}, Required: ${item.quantity}`
          );
        }

        // Calculate item total (quantity * unitPrice) with discount applied
        const itemTotal = item.quantity * item.unitPrice;
        const discountedTotal = itemTotal * (1 - item.discount / 100);
        subtotal += discountedTotal;

        itemsWithProducts.push({
          ...item,
          product,
          totalPrice: discountedTotal,
        });
      }

      // Calculate final total with tax and discount
      const total =
        subtotal + validatedData.taxAmount - validatedData.discountAmount;

      // Create the sales transaction
      const salesTransaction = await tx.salesTransaction.create({
        data: {
          transactionCode,
          cashierId: validatedData.userId,
          subtotal,
          tax: validatedData.taxAmount,
          discount: validatedData.discountAmount,
          total,
          paymentMethod: validatedData.paymentMethod,
          paymentStatus: validatedData.paymentStatus,
          customerName: body.customerName,
          customerEmail: body.customerEmail,
          customerPhone: body.customerPhone,
          notes: validatedData.notes,
        },
      });

      // Create sales items and update stock
      const salesItems = [];
      const stockUpdates = [];

      for (const item of itemsWithProducts) {
        // Create sales item
        const salesItem = await tx.salesItem.create({
          data: {
            transactionId: salesTransaction.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            discount: (item.quantity * item.unitPrice * item.discount) / 100, // Discount amount
          },
        });

        salesItems.push(salesItem);

        // Update product stock
        const newStock = item.product.stock - item.quantity;
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: newStock },
        });

        stockUpdates.push({
          productId: item.productId,
          oldStock: item.product.stock,
          newStock,
          quantity: item.quantity,
        });

        // Create audit log for stock reduction
        await tx.auditLog.create({
          data: {
            action: "STOCK_REDUCTION",
            entityType: "PRODUCT",
            entityId: item.productId.toString(),
            userId: validatedData.userId,
            oldValues: {
              stock: item.product.stock,
            },
            newValues: {
              stock: newStock,
              transactionCode: salesTransaction.transactionCode,
              quantitySold: item.quantity,
            },
          },
        });
      }

      return { salesTransaction, stockUpdates };
    });

    // Fetch the complete transaction with relations
    const completeSalesTransaction = await prisma.salesTransaction.findUnique({
      where: { id: result.salesTransaction.id },
      include: {
        cashier: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        salesItems: {
          include: {
            product: {
              select: { id: true, name: true, sku: true },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        data: completeSalesTransaction,
        stockUpdates: result.stockUpdates,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/sales:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
