import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { handleApiError } from '@/lib/api-error-handler-new';
import { createApiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';

interface KPIData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  uniqueCustomers: number;
  revenueChange: number;
  ordersChange: number;
  aovChange: number;
  customersChange: number;
}

interface RevenueData {
  date: string;
  revenue: number;
}

interface TopProduct {
  id: number;
  name: string;
  revenue: number;
  quantity: number;
}

interface RecentTransaction {
  id: number;
  transactionNumber: string;
  customerName: string | null;
  totalAmount: number;
  createdAt: string;
}

interface AnalyticsResponse {
  kpis: KPIData;
  revenueData: RevenueData[];
  topProducts: TopProduct[];
  recentTransactions: RecentTransaction[];
}

// Database query result interfaces
interface SalesAggregates {
  _sum: {
    total_amount: any; // Prisma Decimal type
  };
  _count: {
    id: number;
  };
}

interface UniqueCustomer {
  customer_email: string;
}

interface TopProductResult {
  product_id: number | null;
  _sum: {
    quantity: number | null;
    total_price: any; // Prisma Decimal type
  };
}

interface RevenueDataResult {
  created_at: Date | null;
  _sum: {
    total_amount: any; // Prisma Decimal type
  };
}

interface RecentTransactionResult {
  id: number;
  transaction_number: string;
  customer_name: string | null;
  total_amount: any; // Prisma Decimal type
  created_at: Date | null;
}

// Helper function to get date filter based on period
function getPeriodFilter(period: string): Date {
  const now = new Date();
  switch (period) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '1y':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days
  }
}

// Helper function to calculate percentage change
function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Use custom date range if provided, otherwise use default 30 days
    let periodStart: Date;
    let periodEnd: Date;

    if (fromDate && toDate) {
      periodStart = new Date(fromDate);
      periodEnd = new Date(toDate + 'T23:59:59'); // End of day
    } else {
      periodStart = getPeriodFilter('30d');
      periodEnd = new Date(); // Current date
    }

    // Calculate previous period for comparison
    const periodDuration = periodEnd.getTime() - periodStart.getTime();
    const previousPeriodStart = new Date(
      periodStart.getTime() - periodDuration
    );
    const previousPeriodEnd = new Date(periodStart.getTime() - 1); // One day before current period

    // Get current period data
    const [
      currentSalesAggregates,
      currentUniqueCustomers,
      currentTopProducts,
      currentRevenueData,
      currentRecentTransactions,
    ] = await Promise.all([
      // Current period sales aggregates
      prisma.salesTransaction.aggregate({
        where: {
          created_at: {
            gte: periodStart,
            lte: periodEnd,
          },
          payment_status: 'paid', // Use lowercase to match database default
        },
        _sum: {
          total_amount: true,
        },
        _count: {
          id: true,
        },
      }) as Promise<SalesAggregates>,

      // Current period unique customers
      prisma.salesTransaction.findMany({
        where: {
          created_at: {
            gte: periodStart,
            lte: periodEnd,
          },
          payment_status: 'paid', // Use lowercase to match database default
          customer_email: {
            not: null,
          },
        },
        select: {
          customer_email: true,
        },
        distinct: ['customer_email'],
      }) as Promise<UniqueCustomer[]>,

      // Current period top products
      prisma.salesItem.groupBy({
        by: ['product_id'],
        where: {
          sales_transactions: {
            created_at: {
              gte: periodStart,
              lte: periodEnd,
            },
            payment_status: 'paid', // Use lowercase to match database default
          },
          product_id: {
            not: null,
          },
        },
        _sum: {
          quantity: true,
          total_price: true,
        },
        orderBy: {
          _sum: {
            total_price: 'desc',
          },
        },
        take: 5,
      }),

      // Current period revenue by day
      prisma.salesTransaction.groupBy({
        by: ['created_at'],
        where: {
          created_at: {
            gte: periodStart,
            lte: periodEnd,
          },
          payment_status: 'paid', // Use lowercase to match database default
        },
        _sum: {
          total_amount: true,
        },
        orderBy: {
          created_at: 'asc',
        },
      }),

      // Current period recent transactions
      prisma.salesTransaction.findMany({
        where: {
          created_at: {
            gte: periodStart,
            lte: periodEnd,
          },
          payment_status: 'paid', // Use lowercase to match database default
        },
        select: {
          id: true,
          transaction_number: true,
          customer_name: true,
          total_amount: true,
          created_at: true,
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 5,
      }),
    ]);

    // Get previous period data for comparison
    const [previousSalesAggregates, previousUniqueCustomers] =
      await Promise.all([
        prisma.salesTransaction.aggregate({
          where: {
            created_at: {
              gte: previousPeriodStart,
              lte: previousPeriodEnd,
            },
            payment_status: 'paid', // Use lowercase to match database default
          },
          _sum: {
            total_amount: true,
          },
          _count: {
            id: true,
          },
        }) as Promise<SalesAggregates>,

        prisma.salesTransaction.findMany({
          where: {
            created_at: {
              gte: previousPeriodStart,
              lte: previousPeriodEnd,
            },
            payment_status: 'paid', // Use lowercase to match database default
            customer_email: {
              not: null,
            },
          },
          select: {
            customer_email: true,
          },
          distinct: ['customer_email'],
        }) as Promise<UniqueCustomer[]>,
      ]);

    // Get product details for top products
    const productIds = currentTopProducts
      .map((p: TopProductResult) => p.product_id)
      .filter((id): id is number => id !== null);

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Calculate KPIs
    const currentRevenue = Number(
      currentSalesAggregates._sum.total_amount || 0
    );
    const currentOrders = currentSalesAggregates._count.id;
    const currentCustomers = currentUniqueCustomers.length;
    const currentAOV = currentOrders > 0 ? currentRevenue / currentOrders : 0;

    const previousRevenue = Number(
      previousSalesAggregates._sum.total_amount || 0
    );
    const previousOrders = previousSalesAggregates._count.id;
    const previousCustomers = previousUniqueCustomers.length;
    const previousAOV =
      previousOrders > 0 ? previousRevenue / previousOrders : 0;

    // Format top products
    const topProducts: TopProduct[] = currentTopProducts.map(
      (item: TopProductResult) => {
        const product = products.find(
          (p: { id: number; name: string }) => p.id === item.product_id
        );
        return {
          id: item.product_id || 0,
          name: product?.name || 'Unknown Product',
          revenue: Number(item._sum.total_price || 0),
          quantity: item._sum.quantity || 0,
        };
      }
    );

    // Format revenue data
    const revenueData: RevenueData[] = currentRevenueData.map(
      (item: RevenueDataResult) => ({
        date: (item.created_at || new Date()).toISOString().split('T')[0],
        revenue: Number(item._sum.total_amount || 0),
      })
    );

    // Format recent transactions
    const recentTransactions: RecentTransaction[] =
      currentRecentTransactions.map((transaction: RecentTransactionResult) => ({
        id: transaction.id,
        transactionNumber: transaction.transaction_number,
        customerName: transaction.customer_name,
        totalAmount: Number(transaction.total_amount),
        createdAt:
          transaction.created_at?.toISOString() || new Date().toISOString(),
      }));

    // Create response
    const response: AnalyticsResponse = {
      kpis: {
        totalRevenue: currentRevenue,
        totalOrders: currentOrders,
        averageOrderValue: currentAOV,
        uniqueCustomers: currentCustomers,
        revenueChange: calculateChange(currentRevenue, previousRevenue),
        ordersChange: calculateChange(currentOrders, previousOrders),
        aovChange: calculateChange(currentAOV, previousAOV),
        customersChange: calculateChange(currentCustomers, previousCustomers),
      },
      revenueData,
      topProducts,
      recentTransactions,
    };

    console.log('Analytics Response:', {
      currentRevenue,
      currentOrders,
      currentCustomers,
      currentAOV,
      revenueDataLength: revenueData.length,
      topProductsLength: topProducts.length,
      recentTransactionsLength: recentTransactions.length,
    });

    return createApiResponse.success(
      response,
      'Analytics data retrieved successfully'
    );
  } catch (error) {
    console.error('Error in GET /api/pos/analytics/overview:', error);
    return handleApiError(error);
  }
});
