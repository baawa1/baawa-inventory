import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { createApiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// GET /api/inventory/stats - Get inventory statistics
export const GET = withAuth(async (_request: AuthenticatedRequest) => {
  try {
    // Aggregate inventory stats in the database
    const [inventoryStats] = await prisma.$queryRaw<
      Array<{
        total_products: bigint;
        low_stock_items: bigint;
        out_of_stock_items: bigint;
        in_stock_items: bigint;
        total_stock_value: unknown;
      }>
    >`
      SELECT
        COUNT(*) FILTER (WHERE "is_archived" = false) AS total_products,
        COUNT(*) FILTER (
          WHERE "is_archived" = false
            AND "stock" > 0
            AND "stock" <= "min_stock"
        ) AS low_stock_items,
        COUNT(*) FILTER (
          WHERE "is_archived" = false
            AND "stock" = 0
        ) AS out_of_stock_items,
        COUNT(*) FILTER (
          WHERE "is_archived" = false
            AND "stock" > "min_stock"
        ) AS in_stock_items,
        COALESCE(
          SUM("stock" * "price") FILTER (WHERE "is_archived" = false),
          0
        ) AS total_stock_value
      FROM "products"
    `;

    const totalProducts = Number(inventoryStats?.total_products || 0);
    const lowStockItems = Number(inventoryStats?.low_stock_items || 0);
    const outOfStockItems = Number(inventoryStats?.out_of_stock_items || 0);
    const inStockItems = Number(inventoryStats?.in_stock_items || 0);
    const totalStockValue = Number(inventoryStats?.total_stock_value || 0);

    // Get suppliers count
    const activeSuppliers = await prisma.supplier.count();

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
    logger.error('Error fetching inventory stats', {
      error: error instanceof Error ? error.message : String(error),
    });
    return createApiResponse.internalError('Failed to fetch inventory stats');
  }
});
