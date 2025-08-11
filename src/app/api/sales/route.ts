import { prisma } from '@/lib/db';
import { createSaleSchema, saleQuerySchema } from '@/lib/validations/sale';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import {
  createApiResponse,
  transformDatabaseResponse,
} from '@/lib/api-response';
import { logger } from '@/lib/logger';
import type {
  SalesFilters,
  SalesWhereClause,
  SalesOrderByClause,
  SalesSelectClause,
  SalesTransactionWithIncludes,
  PaginatedResponse,
  ApiResponse,
} from '@/types/api';

// GET /api/sales - List sales transactions with optional filtering and pagination
export const GET = withAuth(async function (request: AuthenticatedRequest) {
  try {
    // Debug logging removed for production
    const { searchParams } = new URL(request.url);
    // Debug logging removed for production

    // Convert search params to proper types for validation
    const queryParams = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 10,
      search: searchParams.get('search') || undefined,
      paymentStatus: searchParams.get('paymentStatus') || undefined,
      paymentMethod: searchParams.get('paymentMethod') || undefined,
      userId: searchParams.get('userId')
        ? parseInt(searchParams.get('userId')!)
        : undefined,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };

    // Validate query parameters
    // Debug logging removed for production
    const validatedQuery = saleQuerySchema.parse(queryParams);
    // Debug logging removed for production
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
    const where: SalesWhereClause = {};

    // Apply filters
    if (search) {
      where.OR = [
        { transaction_number: { contains: search, mode: 'insensitive' } },
        { customer_name: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
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
    const orderBy: SalesOrderByClause = {};
    if (sortBy === 'createdAt') {
      orderBy.created_at = sortOrder;
    } else if (sortBy === 'total') {
      orderBy.total_amount = sortOrder;
    } else if (sortBy === 'transactionNumber') {
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
          customer_id: true,
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
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              city: true,
              state: true,
              customerType: true,
            },
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
          transaction_fees: {
            select: {
              id: true,
              feeType: true,
              description: true,
              amount: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          split_payments: {
            select: {
              id: true,
              amount: true,
              payment_method: true,
              created_at: true,
            },
            orderBy: {
              created_at: 'asc',
            },
          },
        },
      }),
      prisma.salesTransaction.count({ where }),
    ]);

    // Transform data to match frontend expectations with proper field mapping
    const transformedTransactions = salesTransactions.map(
      (transaction: any) => {
        // Transform the base transaction
        const baseTransaction = transformDatabaseResponse(transaction);

        // Handle nested objects and computed fields
        return {
          ...baseTransaction,
          discount: Number(transaction.discount_amount),
          total: Number(transaction.total_amount),
          subtotal: Number(transaction.subtotal),
          staffName:
            `${transaction.users.firstName} ${transaction.users.lastName}`.trim(),
          staffId: transaction.users.id,
          timestamp: transaction.created_at,
          // Enhanced customer information
          customer: transaction.customer
            ? {
                id: transaction.customer.id,
                name: transaction.customer.name,
                email: transaction.customer.email,
                phone: transaction.customer.phone,
                city: transaction.customer.city,
                state: transaction.customer.state,
                customerType: transaction.customer.customerType,
              }
            : null,
          items: transaction.sales_items.map((item: any) => ({
            id: item.id,
            productId: item.products?.id,
            name: item.products?.name || 'Unknown Product',
            sku: item.products?.sku || '',
            price: Number(item.unit_price),
            quantity: item.quantity,
            total: Number(item.total_price || item.unit_price * item.quantity),
          })),
          // Transaction fees
          fees:
            transaction.transaction_fees?.map((fee: any) => ({
              id: fee.id,
              feeType: fee.feeType,
              description: fee.description,
              amount: Number(fee.amount),
              createdAt: fee.createdAt,
            })) || [],
          splitPayments:
            transaction.split_payments?.map((payment: any) => ({
              id: payment.id,
              amount: Number(payment.amount),
              method: payment.payment_method,
              createdAt: payment.created_at,
            })) || [],
        };
      }
    );

    return createApiResponse.successWithPagination(
      transformedTransactions,
      {
        page,
        limit: safeLimit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / safeLimit),
        hasNext: offset + safeLimit < totalCount,
        hasPrev: page > 1,
      },
      `Retrieved ${transformedTransactions.length} sales transactions`
    );
  } catch (error) {
    logger.error('Error in GET /api/sales', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return createApiResponse.internalError(
      'Internal server error',
      error instanceof Error ? error.message : 'Unknown error'
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
      return createApiResponse.notFound('User');
    }

    // Generate transaction code
    const timestamp = Date.now();
    const transactionCode = `TXN-${timestamp}`;

    // Use Prisma transaction to ensure data consistency
    const result = await prisma.$transaction(async tx => {
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
          customer_id: body.customerId || null,
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

    return createApiResponse.success(
      {
        salesTransaction: completeSalesTransaction,
        stockUpdates: result.stockUpdates,
      },
      'Sales transaction created successfully',
      201
    );
  } catch (error) {
    console.error('Error in POST /api/sales:', error);
    return createApiResponse.internalError(
      error instanceof Error ? error.message : 'Internal server error'
    );
  }
});
