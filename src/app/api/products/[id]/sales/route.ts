import { prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { createApiResponse } from '@/lib/api-response';
import { SUCCESSFUL_PAYMENT_STATUSES } from '@/lib/constants';

// GET /api/products/[id]/sales - Get all sales for a specific product
export const GET = withAuth(async function (
  request: AuthenticatedRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return createApiResponse.error('Invalid product ID', 400);
    }

    // Get all sales items for this product
    const salesItems = await prisma.salesItem.findMany({
      where: {
        product_id: productId,
        sales_transactions: {
          payment_status: {
            in: SUCCESSFUL_PAYMENT_STATUSES,
          },
        },
      },
      include: {
        sales_transactions: {
          select: {
            id: true,
            transaction_number: true,
            created_at: true,
            payment_status: true,
            users: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
        products: {
          select: {
            name: true,
            sku: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Transform and calculate summary
    const transformedItems = salesItems.map(item => ({
      id: item.id,
      transactionId: item.sales_transactions.id,
      transactionNumber: item.sales_transactions.transaction_number,
      quantity: item.quantity,
      price: Number(item.unit_price),
      total: Number(item.total_price),
      transactionDate: item.sales_transactions.created_at,
      customerName: item.sales_transactions.customer?.name || null,
      staffName:
        [
          item.sales_transactions.users?.firstName,
          item.sales_transactions.users?.lastName,
        ]
          .filter(Boolean)
          .join(' ')
          .trim() || 'Unknown staff',
      paymentStatus: item.sales_transactions.payment_status || 'pending',
    }));

    const summary = {
      totalQuantity: transformedItems.reduce((sum, item) => sum + item.quantity, 0),
      totalRevenue: transformedItems.reduce((sum, item) => sum + item.total, 0),
      totalTransactions: transformedItems.length,
      allTransactions: transformedItems.length,
    };

    return createApiResponse.success(
      {
        salesItems: transformedItems,
        summary,
      },
      'Product sales retrieved successfully'
    );
  } catch (error) {
    console.error('Error in GET /api/products/[id]/sales:', error);
    return createApiResponse.internalError('Failed to retrieve product sales');
  }
});
