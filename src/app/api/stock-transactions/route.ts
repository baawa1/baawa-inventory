import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { createApiResponse } from '@/lib/api-response';
import { getStockTransactions, getStockTransactionStats } from '@/lib/stock-transaction';

// GET /api/stock-transactions - Get stock transaction history
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);

    const productId = searchParams.get('productId');
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeStats = searchParams.get('stats') === 'true';

    const options: any = {
      limit,
      offset,
    };

    if (productId) options.productId = parseInt(productId);
    if (type) options.type = type;
    if (userId) options.userId = parseInt(userId);
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);

    const { transactions, total } = await getStockTransactions(options);

    // Optionally include statistics
    let stats = null;
    if (includeStats) {
      stats = await getStockTransactionStats(options.productId);
    }

    return createApiResponse.success(
      {
        transactions,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
        ...(stats && { stats }),
      },
      'Stock transactions retrieved successfully'
    );
  } catch (error) {
    console.error('Error fetching stock transactions:', error);
    return createApiResponse.error(
      'Failed to fetch stock transactions',
      500,
      error
    );
  }
});
