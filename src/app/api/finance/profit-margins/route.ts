import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { createApiResponse } from '@/lib/api-response';
import { z } from 'zod';
import { getFinanceAggregate } from '@/lib/finance/aggregation';
import {
  buildOperatingRevenueBySource,
  summarizeCanonicalFinanceAggregate,
} from '@/lib/finance/metrics';
import {
  buildPositiveIntegerQuerySchema,
  getZodErrorMessage,
} from '@/lib/finance/query-validation';

const profitMarginQuerySchema = z.object({
  months: buildPositiveIntegerQuerySchema('Months', 12, { max: 120 }),
});

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    if (!hasPermission(request.user.role, 'FINANCIAL_ANALYTICS')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to view profit margins'
      );
    }

    const { searchParams } = new URL(request.url);
    const { months: periodMonths } = profitMarginQuerySchema.parse({
      months: searchParams.get('months') || undefined,
    });

    const now = new Date();
    const periods: Array<{
      label: string;
      startDate: Date;
      endDate: Date;
    }> = [];

    for (let i = periodMonths - 1; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      periods.push({
        label: startDate.toLocaleDateString('en-NG', {
          month: 'short',
          year: 'numeric',
        }),
        startDate,
        endDate: endDate > now ? now : endDate,
      });
    }

    const aggregates = await Promise.all(
      periods.map(period =>
        getFinanceAggregate({
          startDate: period.startDate,
          endDate: period.endDate,
        })
      )
    );

    const trends = aggregates.map((aggregate, index) => {
      const metrics = summarizeCanonicalFinanceAggregate(aggregate);
      const revenue = metrics.operatingRevenue;
      const operatingExpenses = metrics.operatingExpenses;
      const cogs = metrics.costOfGoodsSold;
      const grossProfit = metrics.grossProfit;
      const operatingIncome = grossProfit - operatingExpenses;
      const netProfit = metrics.netProfit;

      return {
        period: periods[index].label,
        revenue,
        cogs,
        operatingExpenses,
        grossProfit,
        netProfit,
        grossMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
        netMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
        operatingMargin: revenue > 0 ? (operatingIncome / revenue) * 100 : 0,
      };
    });

    const revenueBySource = buildOperatingRevenueBySource(
      aggregates.flatMap(aggregate => aggregate.transactions)
    );

    const summary = trends.reduce(
      (accumulator, trend) => ({
        totalRevenue: accumulator.totalRevenue + trend.revenue,
        totalGrossProfit: accumulator.totalGrossProfit + trend.grossProfit,
        totalNetProfit: accumulator.totalNetProfit + trend.netProfit,
      }),
      { totalRevenue: 0, totalGrossProfit: 0, totalNetProfit: 0 }
    );

    return createApiResponse.success(
      {
        trends: trends.map(trend => ({
          ...trend,
          grossMargin: Math.round(trend.grossMargin * 100) / 100,
          netMargin: Math.round(trend.netMargin * 100) / 100,
          operatingMargin: Math.round(trend.operatingMargin * 100) / 100,
        })),
        bySource: revenueBySource,
        summary: {
          ...summary,
          averageGrossMargin:
            summary.totalRevenue > 0
              ? Math.round(
                  (summary.totalGrossProfit / summary.totalRevenue) * 10000
                ) / 100
              : 0,
          averageNetMargin:
            summary.totalRevenue > 0
              ? Math.round(
                  (summary.totalNetProfit / summary.totalRevenue) * 10000
                ) / 100
              : 0,
        },
        period: {
          months: periodMonths,
          startDate: periods[0].startDate.toISOString(),
          endDate: periods[periods.length - 1].endDate.toISOString(),
        },
      },
      'Profit margin data retrieved successfully'
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse.validationError(
        getZodErrorMessage(error, 'Invalid profit margin query'),
        error.issues
      );
    }

    console.error('Error fetching profit margins:', error);
    return createApiResponse.internalError('Failed to fetch profit margin data');
  }
});
