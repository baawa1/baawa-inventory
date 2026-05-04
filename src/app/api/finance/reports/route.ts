import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { subDays } from 'date-fns';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createApiResponse } from '@/lib/api-response';
import {
  buildFinanceRange,
  getFinanceAggregate,
  type FinanceAggregationFilters,
} from '@/lib/finance/aggregation';
import {
  buildCanonicalFinanceTrends,
  summarizeCanonicalFinanceAggregate,
} from '@/lib/finance/metrics';
import {
  addFinanceDateRangeIssue,
  getZodErrorMessage,
  optionalFinanceDateInputSchema,
} from '@/lib/finance/query-validation';

const reportParamsSchema = z
  .object({
    period: z
      .enum(['weekly', 'monthly', 'quarterly', 'yearly'])
      .default('monthly'),
    type: z.enum(['all', 'income', 'expense']).default('all'),
    paymentMethod: z.string().optional(),
    dateFrom: optionalFinanceDateInputSchema,
    dateTo: optionalFinanceDateInputSchema,
  })
  .superRefine((value, ctx) => {
    addFinanceDateRangeIssue(value.dateFrom, value.dateTo, ctx, ['dateTo']);
  });

function resolvePeriodRange(
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly',
  dateFrom?: Date,
  dateTo?: Date
) {
  if (dateFrom || dateTo) {
    return buildFinanceRange(dateFrom, dateTo, 'month', {
      comparisonPeriod: 'custom',
    });
  }

  const now = new Date();
  switch (period) {
    case 'weekly':
      return buildFinanceRange(
        subDays(now, 6),
        now,
        'month',
        { comparisonPeriod: 'week' }
      );
    case 'quarterly': {
      const quarter = Math.floor(now.getMonth() / 3);
      return buildFinanceRange(
        new Date(now.getFullYear(), quarter * 3, 1),
        now,
        'month',
        { comparisonPeriod: 'quarter' }
      );
    }
    case 'yearly':
      return buildFinanceRange(new Date(now.getFullYear(), 0, 1), now, 'year', {
        comparisonPeriod: 'year',
      });
    case 'monthly':
    default:
      return buildFinanceRange(
        new Date(now.getFullYear(), now.getMonth(), 1),
        now,
        'month',
        { comparisonPeriod: 'month' }
      );
  }
}

export const GET = withAuth(async function (request: AuthenticatedRequest) {
  try {
    if (!hasPermission(request.user.role, 'FINANCIAL_REPORTS')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to access financial reports'
      );
    }

    const { searchParams } = new URL(request.url);
    const validatedParams = reportParamsSchema.parse({
      period: searchParams.get('period') || undefined,
      type: searchParams.get('type') || undefined,
      paymentMethod: searchParams.get('paymentMethod') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
    });

    const range = resolvePeriodRange(
      validatedParams.period,
      validatedParams.dateFrom,
      validatedParams.dateTo
    );

    const filters: FinanceAggregationFilters = {
      startDate: range.startDate,
      endDate: range.endDate,
      type: validatedParams.type,
      paymentMethod:
        validatedParams.paymentMethod &&
        validatedParams.paymentMethod !== 'all'
          ? validatedParams.paymentMethod
          : undefined,
    };

    const aggregate = await getFinanceAggregate(filters, { groupBy: 'day' });
    const metrics = summarizeCanonicalFinanceAggregate(aggregate);
    const trends = buildCanonicalFinanceTrends(aggregate.transactions, 'day');

    const reportData = {
      profitLoss: {
        revenue: {
          sales: metrics.posSalesRevenue,
          otherIncome: metrics.manualOperatingIncome,
          totalRevenue: metrics.operatingRevenue,
        },
        expenses: {
          costOfGoods: metrics.costOfGoodsSold,
          operatingExpenses: metrics.operatingExpenses,
          totalExpenses: metrics.totalExpenses,
        },
        grossProfit: metrics.grossProfit,
        netProfit: metrics.netProfit,
      },
      cashFlow: {
        operatingActivities: {
          netIncome: metrics.netProfit,
          operatingRevenue: metrics.operatingRevenue,
          operatingExpenses: metrics.operatingExpenses,
          netOperatingCashFlow: metrics.netOperatingCashFlow,
        },
        investingActivities: {
          capitalExpenditures: metrics.costOfGoodsSold,
          investments: 0,
          netInvestingCashFlow: metrics.netInvestingCashFlow,
        },
        financingActivities: {
          loans: metrics.financingInflows,
          repayments: 0,
          netFinancingCashFlow: metrics.netFinancingCashFlow,
        },
      },
      totalCashFlow: metrics.totalCashFlow,
      paymentMethods: aggregate.paymentMethodDistribution.map(item => ({
        method: item.method,
        amount: item.amount,
        count: item.count,
      })),
      trends: trends.map(item => ({
        date: item.date,
        amount: item.netProfit,
        count: item.transactions,
        revenue: item.revenue,
        expenses: item.expenses,
        netProfit: item.netProfit,
      })),
      period: validatedParams.period,
      dateRange: {
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
      },
      summary: {
        totalTransactions: metrics.totalTransactions,
        totalIncome: metrics.operatingRevenue,
        totalExpenses: metrics.totalExpenses,
        netProfit: metrics.netProfit,
        grossProfit: metrics.grossProfit,
        topPaymentMethod: metrics.topPaymentMethod,
        averageTransactionValue: metrics.averageTransactionValue,
      },
    };

    logger.info('Financial report generated', {
      userId: request.user.id,
      period: validatedParams.period,
      type: validatedParams.type,
      transactionCount: metrics.totalTransactions,
    });

    return createApiResponse.success(
      reportData,
      'Financial report generated successfully'
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse.validationError(
        getZodErrorMessage(error, 'Invalid report query'),
        error.issues
      );
    }

    logger.error('Error generating financial report', {
      error: error instanceof Error ? error.message : String(error),
      userId: request.user?.id,
    });
    return createApiResponse.internalError('Failed to generate financial report');
  }
});
