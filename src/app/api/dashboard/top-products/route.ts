import { prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { createApiResponse } from '@/lib/api-response';

// GET /api/dashboard/top-products - Get top selling products
export const GET = withAuth(async (_request: AuthenticatedRequest) => {
  try {
    // Get top products by sales quantity
    const topProducts = await prisma.salesItem.groupBy({
      by: ['product_id'],
      where: {
        product_id: {
          not: null,
        },
      },
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
      take: 10, // Get top 10 products
    });

    // Get product details for the top products
    const productIds = topProducts.map(item => item.product_id).filter(Boolean);
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds as number[],
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
      .filter(Boolean)
      .slice(0, 5); // Return top 5 for the chart

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
