import { prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { createApiResponse } from '@/lib/api-response';
import { SUCCESSFUL_PAYMENT_STATUSES } from '@/lib/constants';

// GET /api/dashboard/recent-transactions - Get recent POS transactions
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Get recent POS transactions
    const recentTransactions = await prisma.salesTransaction.findMany({
      where: {
        transaction_type: 'sale',
        payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sales_items: {
          select: {
            quantity: true,
            products: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { created_at: 'asc' },
          take: 1,
        },
      },
    });

    const transactionIds = recentTransactions.map(
      transaction => transaction.id
    );

    const itemCounts =
      transactionIds.length > 0
        ? await prisma.salesItem.groupBy({
            by: ['transaction_id'],
            where: {
              transaction_id: { in: transactionIds },
            },
            _sum: { quantity: true },
            _count: { id: true },
          })
        : [];

    const itemCountMap = new Map(
      itemCounts.map(item => [item.transaction_id, item])
    );

    // Process the data for display
    const processedTransactions = recentTransactions.map(transaction => {
      const itemStats = itemCountMap.get(transaction.id);

      return {
        id: transaction.id,
        transactionNumber: transaction.transaction_number,
        totalAmount: Number(transaction.total_amount),
        paymentMethod: transaction.payment_method,
        paymentStatus: transaction.payment_status,
        customerName: transaction.customer?.name || 'Walk-in Customer',
        customerEmail: transaction.customer?.email,
        createdAt: transaction.created_at,
        itemCount: itemStats?._count.id || 0,
        totalItems: Number(itemStats?._sum.quantity || 0),
        firstItem: transaction.sales_items[0]?.products?.name || 'Product',
      };
    });

    return createApiResponse.success(
      processedTransactions,
      'Recent transactions retrieved successfully'
    );
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return createApiResponse.error(
      'Failed to fetch recent transactions',
      500,
      error
    );
  }
});
