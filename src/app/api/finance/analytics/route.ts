import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { createApiResponse } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { hasPermission } from '@/lib/auth/roles';
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

const analyticsQuerySchema = z
  .object({
    dateFrom: nullableOptionalFinanceDateInputSchema,
    dateTo: nullableOptionalFinanceDateInputSchema,
    type: z.enum(['all', 'income', 'expense']).optional().default('all'),
    paymentMethod: z.string().nullable().optional(),
    groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
  })
  .superRefine((value, ctx) => {
    addFinanceDateRangeIssue(value.dateFrom, value.dateTo, ctx, ['dateTo']);
  });

function percentageChange(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
}

// GET /api/finance/analytics - Unified analytics across manual finance, POS sales, and stock purchases
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    if (!hasPermission(request.user.role, 'FINANCIAL_ANALYTICS')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to access financial analytics'
      );
    }

    const { searchParams } = new URL(request.url);
    const summaryOnlyParam = searchParams.get('summaryOnly');
    const summaryOnly =
      summaryOnlyParam === '1' || summaryOnlyParam === 'true';

    const validatedQuery = analyticsQuerySchema.parse({
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      type: searchParams.get('type') || 'all',
      paymentMethod: searchParams.get('paymentMethod') || undefined,
      groupBy: searchParams.get('groupBy') || 'day',
    });

    const currentRange = buildFinanceRange(
      validatedQuery.dateFrom,
      validatedQuery.dateTo,
      'month'
    );

    const previousRange = getPreviousFinanceRange(currentRange);

    const [currentAggregate, previousAggregate] = await Promise.all([
      getFinanceAggregate(
        {
          startDate: currentRange.startDate,
          endDate: currentRange.endDate,
          type: validatedQuery.type,
          paymentMethod:
            validatedQuery.paymentMethod &&
            validatedQuery.paymentMethod !== 'all'
              ? validatedQuery.paymentMethod
              : undefined,
        },
        {
          groupBy: validatedQuery.groupBy,
        }
      ),
      getFinanceAggregate({
        startDate: previousRange.startDate,
        endDate: previousRange.endDate,
        type: validatedQuery.type,
        paymentMethod:
          validatedQuery.paymentMethod &&
          validatedQuery.paymentMethod !== 'all'
            ? validatedQuery.paymentMethod
            : undefined,
      }),
    ]);

    const currentMetrics = summarizeCanonicalFinanceAggregate(currentAggregate);
    const previousMetrics = summarizeCanonicalFinanceAggregate(previousAggregate);
    const currentTrends = buildCanonicalFinanceTrends(
      currentAggregate.transactions,
      validatedQuery.groupBy
    );

    const analyticsData = {
      summary: {
        totalRevenue: currentMetrics.operatingRevenue,
        totalExpenses: currentMetrics.totalExpenses,
        netProfit: currentMetrics.netProfit,
        totalTransactions: currentMetrics.totalTransactions,
        averageTransactionValue: currentMetrics.averageTransactionValue,
        topPaymentMethod: currentMetrics.topPaymentMethod,
        revenueGrowth: percentageChange(
          currentMetrics.operatingRevenue,
          previousMetrics.operatingRevenue
        ),
        expenseGrowth: percentageChange(
          currentMetrics.totalExpenses,
          previousMetrics.totalExpenses
        ),
      },
      charts: {
        paymentMethodDistribution:
          currentAggregate.paymentMethodDistribution.map(item => ({
            name: item.method,
            value: item.count,
            amount: item.amount,
          })),
        dailyTrends: currentTrends.map(item => ({
          date: item.date,
          revenue: item.revenue,
          transactions: item.transactions,
        })),
      },
      expenseBreakdown: summaryOnly ? {} : currentAggregate.expenseBreakdown,
      topVendors: summaryOnly ? [] : currentAggregate.topVendors,
      filters: {
        dateFrom: currentRange.startDate.toISOString(),
        dateTo: currentRange.endDate.toISOString(),
        type: validatedQuery.type,
        paymentMethod:
          validatedQuery.paymentMethod &&
          validatedQuery.paymentMethod !== 'all'
            ? validatedQuery.paymentMethod
            : undefined,
        groupBy: validatedQuery.groupBy,
      },
      dataSources: {
        includeSales: true,
        includePurchases: true,
      },
    };

    return createApiResponse.success(
      analyticsData,
      'Financial analytics retrieved successfully'
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse.validationError(
        getZodErrorMessage(error, 'Invalid analytics query'),
        error.issues
      );
    }

    logger.error('Error fetching financial analytics', {
      error: error instanceof Error ? error.message : String(error),
      userId: request.user?.id,
    });
    return createApiResponse.internalError(
      'Failed to fetch financial analytics'
    );
  }
});
