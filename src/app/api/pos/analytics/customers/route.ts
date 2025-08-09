import { NextResponse } from 'next/server';
import { withPOSAuth, AuthenticatedRequest } from '@/lib/api-auth-middleware';
import { prisma } from '@/lib/db';
import { SUCCESSFUL_PAYMENT_STATUSES } from '@/lib/constants';

import { Decimal } from '@prisma/client/runtime/library';

// Type-safe customer client access
const customerClient = prisma as any;

interface CustomerWithTransactions {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  _count: {
    salesTransactions: number;
  };
  salesTransactions: Array<{
    total_amount: Decimal;
    created_at: Date | null;
  }>;
}

interface ProcessedCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  totalSpent: number;
  totalOrders: number;
  lastPurchase: string;
  firstPurchase: string;
  averageOrderValue: number;
  daysSinceLastPurchase: number;
  customerLifetimeValue: number;
  purchaseFrequency: number;
  rank: number;
}

interface CustomerInfo {
  id: number;
  email: string | null;
  name?: string | null;
  phone?: string | null;
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

// Helper function to calculate customer segments
function calculateCustomerSegments(customers: ProcessedCustomer[]) {
  const totalCustomers = customers.length;
  if (totalCustomers === 0) {
    return { vip: 0, regular: 0, occasional: 0, inactive: 0 };
  }

  // Sort customers by total spent
  const sortedCustomers = [...customers].sort(
    (a, b) => b.totalSpent - a.totalSpent
  );

  // Calculate segments based on spending
  const vipThreshold =
    sortedCustomers[Math.floor(totalCustomers * 0.1)]?.totalSpent || 0; // Top 10%
  const regularThreshold =
    sortedCustomers[Math.floor(totalCustomers * 0.4)]?.totalSpent || 0; // Top 50%
  const occasionalThreshold =
    sortedCustomers[Math.floor(totalCustomers * 0.8)]?.totalSpent || 0; // Top 80%

  let vip = 0,
    regular = 0,
    occasional = 0,
    inactive = 0;

  customers.forEach(customer => {
    if (customer.totalSpent >= vipThreshold) {
      vip++;
    } else if (customer.totalSpent >= regularThreshold) {
      regular++;
    } else if (customer.totalSpent >= occasionalThreshold) {
      occasional++;
    } else {
      inactive++;
    }
  });

  return { vip, regular, occasional, inactive };
}

export const GET = withPOSAuth(async (request: AuthenticatedRequest) => {
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

    // Get all customers from Customer table with their transaction aggregates
    const customerTransactions: CustomerWithTransactions[] =
      await customerClient.customer.findMany({
        where: {
          isActive: true,
          salesTransactions: {
            some: {
              payment_status: {
                in: SUCCESSFUL_PAYMENT_STATUSES,
              },
            },
          },
        },
        include: {
          _count: {
            select: {
              salesTransactions: {
                where: {
                  payment_status: {
                    in: SUCCESSFUL_PAYMENT_STATUSES,
                  },
                },
              },
            },
          },
          salesTransactions: {
            where: {
              payment_status: {
                in: SUCCESSFUL_PAYMENT_STATUSES,
              },
            },
            select: {
              total_amount: true,
              created_at: true,
            },
            orderBy: {
              created_at: 'desc',
            },
          },
        },
      });

    // Get current period transactions for new customer calculation
    const currentPeriodCustomers: CustomerInfo[] =
      await customerClient.customer.findMany({
        where: {
          isActive: true,
          salesTransactions: {
            some: {
              payment_status: {
                in: SUCCESSFUL_PAYMENT_STATUSES,
              },
              created_at: {
                gte: periodStart,
                lte: periodEnd,
              },
            },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
        },
      });

    // Get previous period customers for comparison
    const previousPeriodCustomers: CustomerInfo[] =
      await customerClient.customer.findMany({
        where: {
          isActive: true,
          salesTransactions: {
            some: {
              payment_status: {
                in: SUCCESSFUL_PAYMENT_STATUSES,
              },
              created_at: {
                gte: previousPeriodStart,
                lte: previousPeriodEnd,
              },
            },
          },
        },
        select: {
          id: true,
          email: true,
        },
      });

    // Process customer data from Customer table
    const customers: ProcessedCustomer[] = customerTransactions.map(
      customer => {
        const transactions = customer.salesTransactions || [];
        const totalSpent = transactions.reduce(
          (sum: number, t) => sum + Number(t.total_amount || 0),
          0
        );
        const totalOrders = customer._count?.salesTransactions || 0;
        const lastPurchase = transactions[0]?.created_at;
        const firstPurchase = transactions[transactions.length - 1]?.created_at;
        const averageOrderValue =
          totalOrders > 0 ? totalSpent / totalOrders : 0;

        const customerName = customer.name || 'Unknown Customer';
        const customerPhone = customer.phone;

        // Calculate days since last purchase
        const daysSinceLastPurchase = lastPurchase
          ? Math.floor(
              (new Date().getTime() - new Date(lastPurchase).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0;

        // Calculate purchase frequency (average days between purchases)
        const purchaseFrequency =
          totalOrders > 1 && firstPurchase && lastPurchase
            ? Math.floor(
                (new Date(lastPurchase).getTime() -
                  new Date(firstPurchase).getTime()) /
                  (1000 * 60 * 60 * 24)
              ) /
              (totalOrders - 1)
            : 0;

        return {
          id: customer.email || `customer-${customer.id}`,
          name: customerName,
          email: customer.email || '',
          phone: customerPhone,
          totalSpent,
          totalOrders,
          lastPurchase: lastPurchase?.toString() || new Date().toISOString(),
          firstPurchase: firstPurchase?.toString() || new Date().toISOString(),
          averageOrderValue,
          daysSinceLastPurchase,
          customerLifetimeValue: totalSpent, // For now, same as total spent
          purchaseFrequency,
          rank: 0, // Will be calculated later
        };
      }
    );

    // Sort customers by total spent
    customers.sort((a, b) => b.totalSpent - a.totalSpent);

    // Calculate ranks
    customers.forEach((customer, index) => {
      customer.rank = index + 1;
    });

    // Calculate summary statistics
    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const averageOrderValue =
      totalCustomers > 0
        ? customers.reduce((sum, c) => sum + c.averageOrderValue, 0) /
          totalCustomers
        : 0;
    const customerLifetimeValue =
      totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    // Calculate new customers in current period
    const currentPeriodEmails = new Set(
      currentPeriodCustomers.map(c => c.email).filter(Boolean)
    );
    const previousPeriodEmails = new Set(
      previousPeriodCustomers.map(c => c.email).filter(Boolean)
    );

    const newCustomers = Array.from(currentPeriodEmails).filter(
      email => !previousPeriodEmails.has(email)
    ).length;

    // Calculate returning customers (customers who made purchases in both periods)
    const returningCustomers = Array.from(currentPeriodEmails).filter(email =>
      previousPeriodEmails.has(email)
    ).length;

    // Calculate churned customers (customers who purchased in previous period but not current)
    const churnedCustomers = Array.from(previousPeriodEmails).filter(
      email => !currentPeriodEmails.has(email)
    ).length;

    // Calculate retention rate
    const retentionRate =
      previousPeriodEmails.size > 0
        ? (returningCustomers / previousPeriodEmails.size) * 100
        : 0;

    // Calculate customer segments
    const customerSegments = calculateCustomerSegments(customers);

    // Generate customer trends data (last 30 days)
    const customerTrends = [];
    const trendDays = 30;

    // Get historical data for the last 30 days
    const historicalStartDate = new Date();
    historicalStartDate.setDate(historicalStartDate.getDate() - trendDays);

    // For historical trends, we'll use a simpler approach with just customer counts from the Customer table
    const transactionsByDate = new Map<string, Set<string>>();

    // Get all customers and their transaction dates for trends
    const allCustomersWithTransactions = await customerClient.customer.findMany(
      {
        where: {
          isActive: true,
          salesTransactions: {
            some: {
              payment_status: {
                in: SUCCESSFUL_PAYMENT_STATUSES,
              },
              created_at: {
                gte: historicalStartDate,
                lte: new Date(),
              },
            },
          },
        },
        select: {
          email: true,
          salesTransactions: {
            where: {
              payment_status: {
                in: SUCCESSFUL_PAYMENT_STATUSES,
              },
              created_at: {
                gte: historicalStartDate,
                lte: new Date(),
              },
            },
            select: {
              created_at: true,
            },
            orderBy: {
              created_at: 'asc',
            },
          },
        },
      }
    );

    // Group transactions by date with customer emails
    allCustomersWithTransactions.forEach((customer: any) => {
      customer.salesTransactions.forEach((transaction: any) => {
        if (transaction.created_at && customer.email) {
          const dateStr = transaction.created_at.toISOString().split('T')[0];
          if (!transactionsByDate.has(dateStr)) {
            transactionsByDate.set(dateStr, new Set());
          }
          transactionsByDate.get(dateStr)!.add(customer.email);
        }
      });
    });

    // Track new customers (first time purchasers)
    const seenCustomers = new Set();

    for (let i = trendDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayCustomers = transactionsByDate.get(dateStr) || new Set();
      const activeCustomersForDay = dayCustomers.size;

      // Count new customers for this date (customers who haven't been seen before)
      let newCustomersForDay = 0;
      dayCustomers.forEach((email: string) => {
        if (!seenCustomers.has(email)) {
          newCustomersForDay++;
          seenCustomers.add(email);
        }
      });

      customerTrends.push({
        date: dateStr,
        newCustomers: newCustomersForDay,
        activeCustomers: activeCustomersForDay,
      });
    }

    // Get top 10 customers
    const topCustomers = customers.slice(0, 10);

    const response = {
      customers,
      summary: {
        totalCustomers,
        totalRevenue,
        averageOrderValue,
        customerLifetimeValue,
        newCustomers,
        returningCustomers,
        churnedCustomers,
        retentionRate,
      },
      customerSegments,
      customerTrends,
      topCustomers,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch customer analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
