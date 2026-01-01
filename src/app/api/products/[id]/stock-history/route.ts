import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { createApiResponse } from '@/lib/api-response';
import { getProductStockHistory } from '@/lib/stock-transaction';

// GET /api/products/[id]/stock-history - Get stock history for a product
export const GET = withAuth(
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await params;
      const productId = parseInt(id);

      if (isNaN(productId)) {
        return NextResponse.json(
          { error: 'Invalid product ID' },
          { status: 400 }
        );
      }

      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '50');

      const history = await getProductStockHistory(productId, limit);

      return createApiResponse.success(
        {
          productId,
          transactions: history,
          total: history.length,
        },
        'Product stock history retrieved successfully'
      );
    } catch (error) {
      console.error('Error fetching product stock history:', error);
      return createApiResponse.error(
        'Failed to fetch product stock history',
        500,
        error
      );
    }
  }
);
