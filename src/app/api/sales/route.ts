import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSaleSchema, saleQuerySchema } from "@/lib/validations/sale";
import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";

// GET /api/sales - List sales transactions with optional filtering and pagination
export const GET = withAuth(async function (request: AuthenticatedRequest) {
  try {
    console.log("Sales API called with user:", request.user);
    const { searchParams } = new URL(request.url);
    console.log("Search params:", Object.fromEntries(searchParams));

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
    console.log("Validating query params:", queryParams);
    const validatedQuery = saleQuerySchema.parse(queryParams);
    console.log("Query validation successful:", validatedQuery);
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

    // Enforce maximum limit as a safety check
    const safeLimit = Math.min(limit, 100);

    // Calculate offset for pagination
    const offset = (page - 1) * safeLimit;

    // Build where clause for Prisma
    const where: any = {};

    // Apply filters
    if (search) {
      where.OR = [
        { transaction_number: { contains: search, mode: "insensitive" } },
        { customer_name: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    if (paymentStatus) {
      where.payment_status = paymentStatus;
    }

    if (paymentMethod) {
      where.payment_method = paymentMethod;
    }

    if (userId) {
      where.user_id = userId;
    }

    if (fromDate || toDate) {
      where.created_at = {};
      if (fromDate) where.created_at.gte = new Date(fromDate);
      if (toDate) where.created_at.lte = new Date(toDate);
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === "createdAt") {
      orderBy.created_at = sortOrder;
    } else if (sortBy === "total") {
      orderBy.total_amount = sortOrder;
    } else if (sortBy === "transactionNumber") {
      orderBy.transaction_number = sortOrder;
    } else {
      orderBy.created_at = sortOrder; // default fallback
    }

    // Execute queries in parallel for better performance with optimized includes
    const [salesTransactions, totalCount] = await Promise.all([
      prisma.salesTransaction.findMany({
        where,
        orderBy,
        skip: offset,
        take: safeLimit,
        select: {
          id: true,
          transaction_number: true,
          customer_name: true,
          customer_phone: true,
          customer_email: true,
          subtotal: true,
          discount_amount: true,
          tax_amount: true,
          total_amount: true,
          payment_status: true,
          payment_method: true,
          notes: true,
          created_at: true,
          updated_at: true,
          users: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          sales_items: {
            select: {
              id: true,
              quantity: true,
              unit_price: true,
              total_price: true,
              discount_amount: true,
              products: {
                select: { id: true, name: true, sku: true },
              },
            },
          },
        },
      }),
      prisma.salesTransaction.count({ where }),
    ]);

    // Transform data to match frontend expectations
    const transformedTransactions = salesTransactions.map(
      (transaction: any) => ({
        id: transaction.id,
        transactionNumber: transaction.transaction_number,
        customerName: transaction.customer_name,
        customerPhone: transaction.customer_phone,
        customerEmail: transaction.customer_email,
        subtotal: Number(transaction.subtotal),
        discount: Number(transaction.discount_amount),
        total: Number(transaction.total_amount),
        paymentStatus: transaction.payment_status,
        paymentMethod: transaction.payment_method,
        notes: transaction.notes,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
        timestamp: transaction.created_at,
        staffName:
          `${transaction.users.firstName} ${transaction.users.lastName}`.trim(),
        staffId: transaction.users.id,
        items: transaction.sales_items.map((item: any) => ({
          id: item.id,
          productId: item.products?.id,
          name: item.products?.name || "Unknown Product",
          sku: item.products?.sku || "",
          price: Number(item.unit_price),
          quantity: item.quantity,
          total: Number(item.total_price || item.unit_price * item.quantity),
        })),
      })
    );

    return NextResponse.json({
      data: transformedTransactions,
      pagination: {
        page,
        limit: safeLimit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / safeLimit),
        hasNext: offset + safeLimit < totalCount,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/sales:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
});

// POST /api/sales - Create a new sales transaction
export const POST = withAuth(async function (request: AuthenticatedRequest) {
  try {
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
          transaction_number: transactionCode,
          user_id: validatedData.userId,
          subtotal,
          tax_amount: validatedData.taxAmount,
          discount_amount: validatedData.discountAmount,
          total_amount: total,
          payment_method: validatedData.paymentMethod,
          payment_status: validatedData.paymentStatus,
          customer_name: body.customerName,
          customer_email: body.customerEmail,
          customer_phone: body.customerPhone,
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
            transaction_id: salesTransaction.id,
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.totalPrice,
            discount_amount:
              (item.quantity * item.unitPrice * item.discount) / 100,
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
      }

      return { salesTransaction, stockUpdates };
    });

    // Fetch the complete transaction with relations
    const completeSalesTransaction = await prisma.salesTransaction.findUnique({
      where: { id: result.salesTransaction.id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        sales_items: {
          include: {
            products: {
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
});
