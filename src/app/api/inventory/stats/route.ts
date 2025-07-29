import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { createApiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';

// GET /api/inventory/stats - Get inventory statistics
export const GET = withAuth(async (_request: AuthenticatedRequest) => {
  try {
    // Get all products for calculations
    const allProducts = await prisma.product.findMany({
      where: { isArchived: false },
      select: {
        stock: true,
        price: true,
        minStock: true,
      },
    });

    // Get total products
    const totalProducts = allProducts.length;

    // Calculate stock levels using minStock logic
    const lowStockItems = allProducts.filter(
      (p: any) => (p.stock || 0) <= (p.minStock || 0) && (p.stock || 0) > 0
    ).length;

    const outOfStockItems = allProducts.filter(
      (p: any) => (p.stock || 0) === 0
    ).length;

    const inStockItems = allProducts.filter(
      (p: any) => (p.stock || 0) > (p.minStock || 0)
    ).length;

    // Get total stock value
    const totalStockValue = allProducts.reduce(
      (sum: number, product: any) =>
        sum + (product.stock || 0) * Number(product.price || 0),
      0
    );

    // Get active suppliers
    const activeSuppliers = await prisma.supplier.count({
      where: { isActive: true },
    });

    // Get recent sales (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSales = await prisma.salesTransaction.count({
      where: {
        created_at: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Get stock movement (stock additions in last 7 days)
    const stockMovement = await prisma.stockAddition.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    return createApiResponse.success(
      {
        totalProducts,
        lowStockItems,
        outOfStockItems,
        inStockItems,
        totalStockValue,
        activeSuppliers,
        recentSales,
        stockMovement,
      },
      'Inventory statistics retrieved successfully'
    );
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    return createApiResponse.internalError('Failed to fetch inventory stats');
  }
});
