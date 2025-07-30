import { NextResponse } from 'next/server';
import { withPOSAuth, AuthenticatedRequest } from '@/lib/api-auth-middleware';
import { prisma } from '@/lib/db';

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
function calculateCustomerSegments(customers: any[]) {
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

    // Get all customers with their transaction data - group only by email to avoid duplicates
    const customerTransactions = await prisma.salesTransaction.groupBy({
      by: ['customer_email'],
      where: {
        payment_status: {
          in: ['paid', 'completed', 'PAID'], // Include all successful payment statuses
        },
        customer_email: {
          not: null,
        },
      },
      _sum: {
        total_amount: true,
      },
      _count: {
        id: true,
      },
      _max: {
        created_at: true,
      },
      _min: {
        created_at: true,
      },
    });

    // Get customer details (name and phone) for each email
    const customerDetails = await prisma.salesTransaction.groupBy({
      by: ['customer_email', 'customer_name', 'customer_phone'],
      where: {
        payment_status: {
          in: ['paid', 'completed', 'PAID'],
        },
        customer_email: {
          not: null,
        },
      },
      _max: {
        created_at: true, // Get the most recent transaction for each combination
      },
    });

    // Get current period transactions for new customer calculation
    const currentPeriodTransactions = await prisma.salesTransaction.findMany({
      where: {
        payment_status: {
          in: ['paid', 'completed', 'PAID'], // Include all successful payment statuses
        },
        created_at: {
          gte: periodStart,
          lte: periodEnd,
        },
        customer_email: {
          not: null,
        },
      },
      select: {
        customer_email: true,
        customer_name: true,
        customer_phone: true,
        total_amount: true,
        created_at: true,
      },
    });

    // Get previous period transactions for comparison
    const previousPeriodTransactions = await prisma.salesTransaction.findMany({
      where: {
        payment_status: {
          in: ['paid', 'completed', 'PAID'], // Include all successful payment statuses
        },
        created_at: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd,
        },
        customer_email: {
          not: null,
        },
      },
      select: {
        customer_email: true,
        total_amount: true,
      },
    });

    // Create a map of customer details by email (most recent name and phone)
    const customerDetailsMap = new Map();
    customerDetails.forEach(detail => {
      const email = detail.customer_email;
      if (
        !customerDetailsMap.has(email) ||
        (detail._max.created_at &&
          customerDetailsMap.get(email)._max.created_at &&
          detail._max.created_at >
            customerDetailsMap.get(email)._max.created_at)
      ) {
        customerDetailsMap.set(email, detail);
      }
    });

    // Process customer data
    const customers = customerTransactions
      .filter(customer => customer.customer_email) // Only include customers with email
      .map(customer => {
        const totalSpent = Number(customer._sum.total_amount || 0);
        const totalOrders = customer._count.id;
        const lastPurchase = customer._max.created_at;
        const firstPurchase = customer._min.created_at;
        const averageOrderValue =
          totalOrders > 0 ? totalSpent / totalOrders : 0;

        // Get the most recent customer details
        const details = customerDetailsMap.get(customer.customer_email);
        const customerName = details?.customer_name || 'Unknown Customer';
        const customerPhone = details?.customer_phone;

        // Calculate days since last purchase
        const daysSinceLastPurchase = lastPurchase
          ? Math.floor(
              (new Date().getTime() - lastPurchase.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0;

        // Calculate purchase frequency (average days between purchases)
        const purchaseFrequency =
          totalOrders > 1 && firstPurchase && lastPurchase
            ? Math.floor(
                (lastPurchase.getTime() - firstPurchase.getTime()) /
                  (1000 * 60 * 60 * 24)
              ) /
              (totalOrders - 1)
            : 0;

        return {
          id: customer.customer_email,
          name: customerName,
          email: customer.customer_email,
          phone: customerPhone,
          totalSpent,
          totalOrders,
          lastPurchase: lastPurchase?.toISOString() || new Date().toISOString(),
          firstPurchase:
            firstPurchase?.toISOString() || new Date().toISOString(),
          averageOrderValue,
          daysSinceLastPurchase,
          customerLifetimeValue: totalSpent, // For now, same as total spent
          purchaseFrequency,
          rank: 0, // Will be calculated later
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);

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
      currentPeriodTransactions.map(t => t.customer_email)
    );
    const previousPeriodEmails = new Set(
      previousPeriodTransactions.map(t => t.customer_email)
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

    const historicalTransactions = await prisma.salesTransaction.findMany({
      where: {
        payment_status: {
          in: ['paid', 'completed', 'PAID'], // Include all successful payment statuses
        },
        created_at: {
          gte: historicalStartDate,
          lte: new Date(),
        },
        customer_email: {
          not: null,
        },
      },
      select: {
        customer_email: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    // Group transactions by date
    const transactionsByDate = new Map();
    historicalTransactions.forEach(transaction => {
      if (transaction.created_at) {
        const dateStr = transaction.created_at.toISOString().split('T')[0];
        if (!transactionsByDate.has(dateStr)) {
          transactionsByDate.set(dateStr, new Set());
        }
        transactionsByDate.get(dateStr).add(transaction.customer_email);
      }
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
