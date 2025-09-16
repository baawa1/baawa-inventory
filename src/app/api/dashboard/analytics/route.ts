import { prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { createApiResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { hasPermission } from '@/lib/auth/roles';
import {
  PRODUCT_STATUS,
  SUCCESSFUL_PAYMENT_STATUSES,
  API_LIMITS,
  STOCK_THRESHOLDS,
  DATE_RANGES,
} from '@/lib/constants';

// GET /api/dashboard/analytics - Get dashboard analytics data
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || DATE_RANGES.MONTH;

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case DATE_RANGES.WEEK:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case DATE_RANGES.MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case DATE_RANGES.YEAR:
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Check user permissions for different data types
    const canViewRevenue = hasPermission(request.user.role, 'REVENUE_READ');
    const canViewFinancialAnalytics = hasPermission(request.user.role, 'FINANCIAL_ANALYTICS');
    const canViewCustomerAnalytics = hasPermission(request.user.role, 'CUSTOMER_ANALYTICS');

    // Fetch transaction statistics with role-based filtering
    const [transactionStats, topCustomers, lowStockItems] = await Promise.all([
      // Transaction statistics - filtered by permissions
      prisma.$transaction(async tx => {
        const totalTransactions = await tx.salesTransaction.count({
          where: {
            created_at: { gte: startDate },
            payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES },
          },
        });

        const totalItems = await tx.salesItem.aggregate({
          where: {
            sales_transactions: {
              created_at: { gte: startDate },
              payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES },
            },
          },
          _sum: { quantity: true },
        });

        // Only include financial data if user has permission
        let totalSales = null;
        let netSales = null;
        let averageOrderValue = null;

        if (canViewRevenue) {
          const salesResult = await tx.salesTransaction.aggregate({
            where: {
              created_at: { gte: startDate },
              payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES },
            },
            _sum: { total_amount: true },
          });

          const netSalesResult = await tx.salesTransaction.aggregate({
            where: {
              created_at: { gte: startDate },
              payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES },
            },
            _sum: { subtotal: true },
          });

          totalSales = Number(salesResult._sum.total_amount || 0);
          netSales = Number(netSalesResult._sum.subtotal || 0);
          averageOrderValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;
        }

        return {
          totalSales: canViewRevenue ? totalSales : null,
          netSales: canViewRevenue ? netSales : null,
          totalTransactions,
          totalItems: Number(totalItems._sum.quantity || 0),
          averageOrderValue: canViewRevenue ? averageOrderValue : null,
        };
      }),

      // Top customers - only if user has customer analytics permission
      canViewCustomerAnalytics
        ? prisma.salesTransaction.groupBy({
            by: ['customer_id'],
            where: {
              created_at: { gte: startDate },
              payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES },
              customer_id: { not: null },
            },
            _sum: { total_amount: true },
            _count: { id: true },
            orderBy: { _sum: { total_amount: 'desc' } },
            take: API_LIMITS.TOP_CUSTOMERS_LIMIT,
          })
        : [],

      // Low stock items - simplified query
      prisma.product.findMany({
        where: {
          status: PRODUCT_STATUS.ACTIVE,
          isArchived: false,
          OR: [
            { stock: STOCK_THRESHOLDS.CRITICAL_STOCK },
            { stock: { lte: STOCK_THRESHOLDS.LOW_STOCK_DEFAULT } },
          ],
        },
        orderBy: [{ stock: 'asc' }, { name: 'asc' }],
        take: API_LIMITS.LOW_STOCK_DISPLAY_LIMIT,
      }),
    ]);

    // Transform top customers data - only if user has permissions
    const transformedTopCustomers = canViewCustomerAnalytics
      ? await Promise.all(
          topCustomers.map(async (customerData, index) => {
            const customer = await prisma.customer.findUnique({
              where: { id: customerData.customer_id! },
              select: { id: true, name: true, email: true },
            });

            return {
              id: index + 1,
              name: customer?.name || 'Unknown Customer',
              orders: customerData._count.id,
              totalSpend: canViewRevenue ? Number(customerData._sum.total_amount || 0) : null,
            };
          })
        )
      : [];

    // Transform low stock items data
    const transformedLowStockItems = lowStockItems.map(item => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      currentStock: item.stock,
      minStock: item.minStock,
      price: Number(item.price),
      category: 'Uncategorized', // Will be fetched separately if needed
      supplier: 'Unknown Supplier', // Will be fetched separately if needed
      lastRestocked: item.updatedAt?.toISOString().split('T')[0] || 'Unknown',
      status:
        item.stock === STOCK_THRESHOLDS.CRITICAL_STOCK
          ? 'critical'
          : item.stock <= STOCK_THRESHOLDS.LOW_STOCK_DEFAULT
            ? 'low'
            : 'normal',
    }));

    // Generate sales data for charts (last 30 days) - with role-based filtering
    const salesData = [];
    const daysToShow = API_LIMITS.SALES_CHART_DAYS;

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      const daySales = await prisma.salesTransaction.aggregate({
        where: {
          created_at: {
            gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            lt: new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate() + 1
            ),
          },
          payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES },
        },
        _sum: canViewRevenue ? { total_amount: true, subtotal: true } : undefined,
        _count: { id: true },
      });

      salesData.push({
        date: dateStr,
        sales: canViewRevenue ? Number(daySales._sum?.total_amount || 0) : null,
        orders: daySales._count.id,
        netSales: canViewRevenue ? Number(daySales._sum?.subtotal || 0) : null,
      });
    }

    // Sample data for categories and products - filtered by permissions
    const topCategories = canViewFinancialAnalytics
      ? [
          { id: 1, name: 'Electronics', itemsSold: 15, netSales: 450000 },
          { id: 2, name: 'Wristwatches', itemsSold: 8, netSales: 320000 },
          { id: 3, name: 'Accessories', itemsSold: 12, netSales: 180000 },
        ]
      : [
          { id: 1, name: 'Electronics', itemsSold: 15, netSales: null },
          { id: 2, name: 'Wristwatches', itemsSold: 8, netSales: null },
          { id: 3, name: 'Accessories', itemsSold: 12, netSales: null },
        ];

    const topProducts = canViewFinancialAnalytics
      ? [
          { id: 1, name: 'Apple Watch Series 9', itemsSold: 5, netSales: 425000 },
          { id: 2, name: 'Wireless Earbuds Pro', itemsSold: 8, netSales: 200000 },
          { id: 3, name: 'Smart Fitness Tracker', itemsSold: 3, netSales: 105000 },
        ]
      : [
          { id: 1, name: 'Apple Watch Series 9', itemsSold: 5, netSales: null },
          { id: 2, name: 'Wireless Earbuds Pro', itemsSold: 8, netSales: null },
          { id: 3, name: 'Smart Fitness Tracker', itemsSold: 3, netSales: null },
        ];

    return createApiResponse.success(
      {
        transactionStats,
        salesData,
        topCustomers: transformedTopCustomers,
        topCategories,
        topProducts,
        lowStockItems: transformedLowStockItems,
      },
      'Analytics data retrieved successfully'
    );
  } catch (error) {
    logger.error('Error fetching analytics data', {
      error: error instanceof Error ? error.message : String(error),
    });
    return createApiResponse.internalError('Failed to fetch analytics data');
  }
});
