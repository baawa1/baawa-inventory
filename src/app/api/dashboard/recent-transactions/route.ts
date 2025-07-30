import { prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { createApiResponse } from '@/lib/api-response';

// GET /api/dashboard/recent-transactions - Get recent POS transactions
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Get recent POS transactions
    const recentTransactions = await prisma.salesTransaction.findMany({
      where: {
        transaction_type: 'sale',
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
      select: {
        id: true,
        transaction_number: true,
        total_amount: true,
        payment_method: true,
        payment_status: true,
        customer_name: true,
        customer_email: true,
        created_at: true,
        sales_items: {
          select: {
            quantity: true,
            products: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Process the data for display
    const processedTransactions = recentTransactions.map(transaction => ({
      id: transaction.id,
      transactionNumber: transaction.transaction_number,
      totalAmount: Number(transaction.total_amount),
      paymentMethod: transaction.payment_method,
      paymentStatus: transaction.payment_status,
      customerName: transaction.customer_name || 'Walk-in Customer',
      customerEmail: transaction.customer_email,
      createdAt: transaction.created_at,
      itemCount: transaction.sales_items.length,
      totalItems: transaction.sales_items.reduce((sum, item) => sum + item.quantity, 0),
      firstItem: transaction.sales_items[0]?.products?.name || 'Product',
    }));

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