import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { createApiResponse } from '@/lib/api-response';
import { z } from 'zod';
import {
  buildFinanceRange,
  getFinanceAggregate,
  getPreviousFinanceRange,
} from '@/lib/finance/aggregation';
import {
  buildCanonicalFinanceTrends,
  summarizeCanonicalFinanceAggregate,
} from '@/lib/finance/metrics';
import {
  addFinanceDateRangeIssue,
  getZodErrorMessage,
  nullableOptionalFinanceDateInputSchema,
} from '@/lib/finance/query-validation';

interface TrendAnalysis {
  revenue: {
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  expenses: {
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  profit: {
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  transactions: {
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
}

interface PerformanceMetrics {
  profitMargin: number;
  averageTransactionValue: number;
  revenuePerTransaction: number;
  expenseRatio: number;
}

interface Predictions {
  nextMonthRevenue: number;
  nextMonthExpenses: number;
  nextMonthProfit: number;
  growthRate: number;
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function getTrendDirection(change: number): 'up' | 'down' | 'stable' {
  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'stable';
}

const advancedAnalyticsQuerySchema = z
  .object({
    fromDate: nullableOptionalFinanceDateInputSchema,
    toDate: nullableOptionalFinanceDateInputSchema,
    type: z.enum(['all', 'income', 'expense']).default('all'),
    paymentMethod: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    addFinanceDateRangeIssue(value.fromDate, value.toDate, ctx, ['toDate']);
  });

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    if (!hasPermission(request.user.role, 'FINANCIAL_ANALYTICS')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to access advanced analytics'
      );
    }

    const { searchParams } = new URL(request.url);
    const validatedQuery = advancedAnalyticsQuerySchema.parse({
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
      type: searchParams.get('type') || 'all',
      paymentMethod: searchParams.get('paymentMethod') || undefined,
    });

    const currentRange = buildFinanceRange(
      validatedQuery.fromDate,
      validatedQuery.toDate,
      'month'
    );

    const previousRange = getPreviousFinanceRange(currentRange);

    const [currentAggregate, previousAggregate] = await Promise.all([
      getFinanceAggregate(
        {
          startDate: currentRange.startDate,
          endDate: currentRange.endDate,
          type: validatedQuery.type,
          paymentMethod: validatedQuery.paymentMethod,
        },
        { groupBy: 'week' }
      ),
      getFinanceAggregate({
        startDate: previousRange.startDate,
        endDate: previousRange.endDate,
        type: validatedQuery.type,
        paymentMethod: validatedQuery.paymentMethod,
      }),
    ]);

    const currentMetrics = summarizeCanonicalFinanceAggregate(currentAggregate);
    const previousMetrics = summarizeCanonicalFinanceAggregate(previousAggregate);
    const weeklyTrends = buildCanonicalFinanceTrends(
      currentAggregate.transactions,
      'week'
    );

    const revenueChange = calculateChange(
      currentMetrics.operatingRevenue,
      previousMetrics.operatingRevenue
    );
    const expenseChange = calculateChange(
      currentMetrics.totalExpenses,
      previousMetrics.totalExpenses
    );
    const profitChange = calculateChange(
      currentMetrics.netProfit,
      previousMetrics.netProfit
    );
    const transactionChange = calculateChange(
      currentMetrics.totalTransactions,
      previousMetrics.totalTransactions
    );

    const trendAnalysis: TrendAnalysis = {
      revenue: {
        current: currentMetrics.operatingRevenue,
        previous: previousMetrics.operatingRevenue,
        change: revenueChange,
        trend: getTrendDirection(revenueChange),
      },
      expenses: {
        current: currentMetrics.totalExpenses,
        previous: previousMetrics.totalExpenses,
        change: expenseChange,
        trend: getTrendDirection(expenseChange),
      },
      profit: {
        current: currentMetrics.netProfit,
        previous: previousMetrics.netProfit,
        change: profitChange,
        trend: getTrendDirection(profitChange),
      },
      transactions: {
        current: currentMetrics.totalTransactions,
        previous: previousMetrics.totalTransactions,
        change: transactionChange,
        trend: getTrendDirection(transactionChange),
      },
    };

    const performanceMetrics: PerformanceMetrics = {
      profitMargin:
        currentMetrics.operatingRevenue > 0
          ? (currentMetrics.netProfit / currentMetrics.operatingRevenue) *
            100
          : 0,
      averageTransactionValue: currentMetrics.averageTransactionValue,
      revenuePerTransaction:
        currentMetrics.totalTransactions > 0
          ? currentMetrics.operatingRevenue / currentMetrics.totalTransactions
          : 0,
      expenseRatio:
        currentMetrics.operatingRevenue > 0
          ? (currentMetrics.totalExpenses / currentMetrics.operatingRevenue) *
            100
          : 0,
    };

    const weeklyAverageRevenue =
      weeklyTrends.length > 0
        ? weeklyTrends.reduce((sum, item) => sum + item.revenue, 0) /
          weeklyTrends.length
        : 0;
    const weeklyAverageExpenses =
      weeklyTrends.length > 0
        ? weeklyTrends.reduce((sum, item) => sum + item.expenses, 0) /
          weeklyTrends.length
        : 0;

    const predictions: Predictions = {
      nextMonthRevenue: Math.round((weeklyAverageRevenue * 4.3) * 100) / 100,
      nextMonthExpenses:
        Math.round((weeklyAverageExpenses * 4.3) * 100) / 100,
      nextMonthProfit:
        Math.round((weeklyAverageRevenue - weeklyAverageExpenses) * 4.3 * 100) /
        100,
      growthRate: Math.round(revenueChange * 100) / 100,
    };

    return createApiResponse.success(
      {
        trendAnalysis,
        performanceMetrics,
        predictions,
      },
      'Advanced analytics retrieved successfully'
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse.validationError(
        getZodErrorMessage(error, 'Invalid analytics query'),
        error.issues
      );
    }

    console.error('Error fetching advanced analytics:', error);
    return createApiResponse.internalError('Failed to fetch advanced analytics');
  }
});
