import { prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { createApiResponse } from '@/lib/api-response';
import { z } from 'zod';

const analyticsQuerySchema = z.object({
  dateFrom: z.string().nullable().optional(),
  dateTo: z.string().nullable().optional(),
  type: z.enum(['all', 'income', 'expense']).optional().default('all'),
  paymentMethod: z.string().nullable().optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
});

// GET /api/finance/analytics - Get financial analytics data
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      type: searchParams.get('type') || 'all',
      paymentMethod: searchParams.get('paymentMethod') || undefined,
      groupBy: searchParams.get('groupBy') || 'day',
    };

    const validatedQuery = analyticsQuerySchema.parse(queryParams);

    // Build where clause for date filtering
    const where: any = {};
    if (validatedQuery.dateFrom || validatedQuery.dateTo) {
      where.transactionDate = {};
      if (validatedQuery.dateFrom) {
        where.transactionDate.gte = new Date(validatedQuery.dateFrom);
      }
      if (validatedQuery.dateTo) {
        where.transactionDate.lte = new Date(
          validatedQuery.dateTo + 'T23:59:59'
        );
      }
    }

    // Add payment method filter
    if (
      validatedQuery.paymentMethod &&
      validatedQuery.paymentMethod !== 'all'
    ) {
      where.paymentMethod = validatedQuery.paymentMethod;
    }

    // Add type filter
    if (validatedQuery.type && validatedQuery.type !== 'all') {
      where.type = validatedQuery.type.toUpperCase();
    }

    // Get transaction statistics
    const [
      totalIncome,
      totalExpenses,
      totalTransactions,
      averageTransactionValue,
      paymentMethodStats,
      dailyStats,
    ] = await Promise.all([
      // Total income
      prisma.financialTransaction.aggregate({
        where: {
          ...where,
          type: 'INCOME',
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
      }),

      // Total expenses
      prisma.financialTransaction.aggregate({
        where: {
          ...where,
          type: 'EXPENSE',
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
      }),

      // Total transaction count
      prisma.financialTransaction.count({
        where: {
          ...where,
          status: 'COMPLETED',
        },
      }),

      // Average transaction value
      prisma.financialTransaction.aggregate({
        where: {
          ...where,
          status: 'COMPLETED',
        },
        _avg: {
          amount: true,
        },
      }),

      // Payment method distribution
      prisma.financialTransaction.groupBy({
        by: ['paymentMethod'],
        where: {
          ...where,
          status: 'COMPLETED',
        },
        _count: {
          paymentMethod: true,
        },
        _sum: {
          amount: true,
        },
      }),

      // Daily statistics for charts
      prisma.financialTransaction.groupBy({
        by: ['transactionDate'],
        where: {
          ...where,
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          transactionDate: 'asc',
        },
      }),
    ]);

    // Calculate net profit
    const income = Number(totalIncome._sum.amount) || 0;
    const expenses = Number(totalExpenses._sum.amount) || 0;
    const netProfit = income - expenses;

    // Process payment method stats
    const paymentMethodData = paymentMethodStats.map((stat: any) => ({
      name: stat.paymentMethod || 'Unknown',
      value: stat._count.paymentMethod,
      amount: stat._sum.amount || 0,
    }));

    // Process daily stats for charts
    const chartData = dailyStats.map((stat: any) => ({
      date: stat.transactionDate?.toISOString().split('T')[0] || '',
      revenue: Number(stat._sum.amount) || 0,
      transactions: stat._count.id,
    }));

    // Get top payment method
    const topPaymentMethod = paymentMethodData.reduce(
      (prev: any, current: any) => (prev.value > current.value ? prev : current)
    );

    // Calculate growth percentages (mock data for now)
    const revenueGrowth = 12.5; // Mock growth percentage
    const expenseGrowth = 8.2; // Mock growth percentage

    const analyticsData = {
      summary: {
        totalRevenue: income,
        totalExpenses: expenses,
        netProfit,
        totalTransactions,
        averageTransactionValue:
          Number(averageTransactionValue._avg.amount) || 0,
        topPaymentMethod: topPaymentMethod?.name || 'Cash',
        revenueGrowth,
        expenseGrowth,
      },
      charts: {
        paymentMethodDistribution: paymentMethodData,
        dailyTrends: chartData,
      },
      filters: {
        dateFrom: validatedQuery.dateFrom,
        dateTo: validatedQuery.dateTo,
        type: validatedQuery.type,
        paymentMethod: validatedQuery.paymentMethod,
        groupBy: validatedQuery.groupBy,
      },
    };

    return createApiResponse.success(
      analyticsData,
      'Analytics data retrieved successfully'
    );
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return createApiResponse.error(
      'Failed to fetch analytics data',
      500,
      error
    );
  }
});
