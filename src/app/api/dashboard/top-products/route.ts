import { prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { createApiResponse } from '@/lib/api-response';
import { SUCCESSFUL_PAYMENT_STATUSES } from '@/lib/constants';

// GET /api/dashboard/top-products - Get top selling products
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const dateFromParam = searchParams.get('dateFrom');
    const dateToParam = searchParams.get('dateTo');
    const invalidFields: string[] = [];

    const parseDateParam = (value: string | null, field: string) => {
      if (!value) return undefined;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        invalidFields.push(field);
        return undefined;
      }
      return parsed;
    };

    const whereClause: any = {
      sales_transactions: {
        payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES },
        transaction_type: 'sale',
      },
    };

    if (dateFromParam || dateToParam) {
      const parsedFrom = parseDateParam(dateFromParam, 'dateFrom');
      const parsedTo = parseDateParam(dateToParam, 'dateTo');

      if (invalidFields.length > 0) {
        return createApiResponse.validationError(
          `Invalid ${invalidFields.join(', ')}`
        );
      }

      const normalizeStartOfDay = (date: Date) => {
        const normalized = new Date(date);
        normalized.setHours(0, 0, 0, 0);
        return normalized;
      };

      const normalizeEndOfDay = (date: Date) => {
        const normalized = new Date(date);
        normalized.setHours(23, 59, 59, 999);
        return normalized;
      };

      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (parsedFrom) {
        startDate = normalizeStartOfDay(parsedFrom);
      }

      if (parsedTo) {
        endDate = normalizeEndOfDay(parsedTo);
      }

      if (!startDate && endDate) {
        startDate = normalizeStartOfDay(endDate);
      }

      if (!endDate && startDate) {
        endDate = normalizeEndOfDay(new Date());
      }

      if (startDate && endDate && startDate > endDate) {
        const swap = startDate;
        startDate = endDate;
        endDate = swap;
      }

      whereClause.sales_transactions.created_at = {};
      if (startDate) {
        whereClause.sales_transactions.created_at.gte = startDate;
      }
      if (endDate) {
        whereClause.sales_transactions.created_at.lte = endDate;
      }
    }

    // Get top products by sales quantity
    const topProducts = await prisma.salesItem.groupBy({
      by: ['product_id'],
      where: whereClause,
      _sum: {
        quantity: true,
        total_price: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5, // Get top 5 products
    });

    // Get product details for the top products
    const productIds = topProducts.map(item => item.product_id);
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        images: true,
      },
    });

    // Combine the data
    const topProductsData = topProducts
      .map(item => {
        const product = products.find(p => p.id === item.product_id);
        if (!product) return null;

        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          sales: item._sum.quantity || 0,
          revenue: Number(item._sum.total_price) || 0,
          transactions: item._count.id,
          price: Number(product.price) || 0,
          images: product.images,
        };
      })
      .filter(Boolean);

    return createApiResponse.success(
      topProductsData,
      'Top products data retrieved successfully'
    );
  } catch (error) {
    console.error('Error fetching top products:', error);
    return createApiResponse.error(
      'Failed to fetch top products data',
      500,
      error
    );
  }
});
