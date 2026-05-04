import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { createApiResponse } from '@/lib/api-response';
import { z } from 'zod';
import { buildFinanceRange, getFinanceAggregate } from '@/lib/finance/aggregation';
import { summarizeCanonicalFinanceAggregate } from '@/lib/finance/metrics';
import {
  buildPositiveIntegerQuerySchema,
  getZodErrorMessage,
} from '@/lib/finance/query-validation';

const kpiQuerySchema = z.object({
  months: buildPositiveIntegerQuerySchema('Months', 3, { max: 120 }),
});

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    if (!hasPermission(request.user.role, 'FINANCIAL_ANALYTICS')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to view financial KPIs'
      );
    }

    const { searchParams } = new URL(request.url);
    const { months } = kpiQuerySchema.parse({
      months: searchParams.get('months') || undefined,
    });

    const now = new Date();
    const periodRange = buildFinanceRange(
      new Date(now.getFullYear(), now.getMonth() - months + 1, 1),
      now,
      'month'
    );

    const [periodAggregate, allTimeAggregate] = await Promise.all([
      getFinanceAggregate({
        startDate: periodRange.startDate,
        endDate: periodRange.endDate,
      }),
      getFinanceAggregate({}),
    ]);

    const periodMetrics = summarizeCanonicalFinanceAggregate(periodAggregate);
    const allTimeMetrics = summarizeCanonicalFinanceAggregate(allTimeAggregate);
    const totalIncome = periodMetrics.operatingRevenue;
    const totalExpenses = periodMetrics.totalExpenses;
    const netProfit = periodMetrics.netProfit;

    const daysInPeriod = Math.max(
      1,
      Math.ceil(
        (periodRange.endDate.getTime() - periodRange.startDate.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

    const dailyBurnRate = totalExpenses / daysInPeriod;
    const monthlyBurnRate = dailyBurnRate * 30;
    const estimatedCashPosition = allTimeMetrics.totalCashFlow;
    const runwayMonths =
      monthlyBurnRate > 0
        ? Math.max(0, estimatedCashPosition / monthlyBurnRate)
        : Infinity;
    const operatingExpenseRatio =
      totalIncome > 0
        ? (periodMetrics.operatingExpenses / totalIncome) * 100
        : 0;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
    const breakEvenRevenue = monthlyBurnRate;
    const dailyRevenue = totalIncome / daysInPeriod;
    const daysToBreakEven =
      netProfit < 0 && dailyRevenue > dailyBurnRate
        ? Math.abs(netProfit) / (dailyRevenue - dailyBurnRate)
        : 0;

    const kpis = {
      period: {
        startDate: periodRange.startDate.toISOString(),
        endDate: periodRange.endDate.toISOString(),
        days: daysInPeriod,
        months,
      },
      summary: {
        totalIncome,
        totalExpenses,
        netProfit,
        profitMargin: Math.round(profitMargin * 100) / 100,
      },
      burnRate: {
        daily: Math.round(dailyBurnRate * 100) / 100,
        monthly: Math.round(monthlyBurnRate * 100) / 100,
        trend: 'stable',
      },
      runway: {
        months:
          runwayMonths === Infinity ? null : Math.round(runwayMonths * 10) / 10,
        estimatedCashPosition:
          Math.round(estimatedCashPosition * 100) / 100,
        status:
          runwayMonths === Infinity
            ? 'healthy'
            : runwayMonths > 6
              ? 'healthy'
              : runwayMonths > 3
                ? 'caution'
                : 'critical',
      },
      efficiency: {
        operatingExpenseRatio:
          Math.round(operatingExpenseRatio * 100) / 100,
        breakEvenRevenue: Math.round(breakEvenRevenue * 100) / 100,
        dailyRevenue: Math.round(dailyRevenue * 100) / 100,
        daysToBreakEven: daysToBreakEven > 0 ? Math.ceil(daysToBreakEven) : null,
      },
      health: {
        score: calculateHealthScore(
          profitMargin,
          runwayMonths,
          operatingExpenseRatio
        ),
        indicators: {
          profitability: profitMargin > 0 ? 'positive' : 'negative',
          cashflow:
            runwayMonths > 6 ? 'healthy' : runwayMonths > 3 ? 'moderate' : 'low',
          efficiency: operatingExpenseRatio < 80 ? 'efficient' : 'high-cost',
        },
      },
    };

    return createApiResponse.success(
      kpis,
      'Financial KPIs calculated successfully'
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse.validationError(
        getZodErrorMessage(error, 'Invalid KPI query'),
        error.issues
      );
    }

    console.error('Error calculating financial KPIs:', error);
    return createApiResponse.internalError('Failed to calculate financial KPIs');
  }
});

function calculateHealthScore(
  profitMargin: number,
  runwayMonths: number,
  opExRatio: number
): number {
  let score = 50;

  if (profitMargin > 20) score += 30;
  else if (profitMargin > 10) score += 20;
  else if (profitMargin > 0) score += 10;
  else if (profitMargin <= -10) score -= 10;

  if (runwayMonths === Infinity || runwayMonths > 12) score += 20;
  else if (runwayMonths > 6) score += 15;
  else if (runwayMonths > 3) score += 5;
  else score -= 10;

  if (opExRatio < 60) score += 10;
  else if (opExRatio < 80) score += 5;
  else if (opExRatio > 100) score -= 10;

  return Math.max(0, Math.min(100, score));
}
