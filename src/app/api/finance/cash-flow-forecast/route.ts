import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { createApiResponse } from '@/lib/api-response';
import { z } from 'zod';
import {
  buildFinanceRange,
  getFinanceAggregate,
} from '@/lib/finance/aggregation';
import { formatFinanceDateInput } from '@/lib/finance/date-range';
import {
  buildCanonicalFinanceTrends,
  summarizeCanonicalFinanceAggregate,
} from '@/lib/finance/metrics';
import {
  buildPositiveIntegerQuerySchema,
  getZodErrorMessage,
} from '@/lib/finance/query-validation';

const cashFlowForecastQuerySchema = z.object({
  days: buildPositiveIntegerQuerySchema('Forecast days', 90, { max: 365 }),
  historicalMonths: buildPositiveIntegerQuerySchema('Historical months', 6, {
    max: 120,
  }),
});

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    if (!hasPermission(request.user.role, 'FINANCIAL_ANALYTICS')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to view cash flow forecast'
      );
    }

    const { searchParams } = new URL(request.url);
    const { days: forecastDays, historicalMonths } =
      cashFlowForecastQuerySchema.parse({
        days: searchParams.get('days') || undefined,
        historicalMonths:
          searchParams.get('historicalMonths') || undefined,
      });

    const now = new Date();
    const historicalRange = buildFinanceRange(
      new Date(now.getFullYear(), now.getMonth() - historicalMonths, 1),
      now,
      'month'
    );

    const [historicalAggregate, allTimeAggregate] = await Promise.all([
      getFinanceAggregate(
        {
          startDate: historicalRange.startDate,
          endDate: historicalRange.endDate,
        },
        { groupBy: 'day' }
      ),
      getFinanceAggregate({}),
    ]);

    const historicalMetrics = summarizeCanonicalFinanceAggregate(
      historicalAggregate
    );
    const allTimeMetrics = summarizeCanonicalFinanceAggregate(allTimeAggregate);
    const historicalTrends = buildCanonicalFinanceTrends(
      historicalAggregate.transactions,
      'day'
    );

    const daysOfHistory = Math.max(
      1,
      Math.ceil(
        (historicalRange.endDate.getTime() - historicalRange.startDate.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

    const avgDailyIncome = historicalMetrics.operatingRevenue / daysOfHistory;
    const avgDailyExpense = historicalMetrics.totalExpenses / daysOfHistory;
    const avgDailyNetCashFlow = avgDailyIncome - avgDailyExpense;
    const currentCashPosition = allTimeMetrics.totalCashFlow;

    const dailyBuckets = Array.from({ length: 7 }, () => ({
      income: 0,
      count: 0,
    }));

    historicalTrends.forEach(trend => {
      const day = new Date(trend.date).getDay();
      dailyBuckets[day].income += trend.revenue;
      if (trend.transactions > 0) {
        dailyBuckets[day].count += 1;
      }
    });

    const dayMultipliers = dailyBuckets.map(bucket => {
      const averageForDay = bucket.income / Math.max(1, bucket.count);
      return avgDailyIncome > 0 ? averageForDay / avgDailyIncome : 1;
    });

    const fullForecast: Array<{
      date: string;
      projectedIncome: number;
      projectedExpense: number;
      projectedNetCashFlow: number;
      projectedCashPosition: number;
      confidence: 'high' | 'medium' | 'low';
    }> = [];

    let runningCashPosition = currentCashPosition;

    for (let offset = 1; offset <= forecastDays; offset += 1) {
      const forecastDate = new Date(now);
      forecastDate.setDate(forecastDate.getDate() + offset);
      const dayOfWeek = forecastDate.getDay();
      const multiplier = dayMultipliers[dayOfWeek] || 1;

      const projectedIncome = avgDailyIncome * multiplier;
      const projectedExpense = avgDailyExpense;
      const projectedNetCashFlow = projectedIncome - projectedExpense;

      runningCashPosition += projectedNetCashFlow;

      fullForecast.push({
        date: formatFinanceDateInput(forecastDate),
        projectedIncome: Math.round(projectedIncome * 100) / 100,
        projectedExpense: Math.round(projectedExpense * 100) / 100,
        projectedNetCashFlow: Math.round(projectedNetCashFlow * 100) / 100,
        projectedCashPosition: Math.round(runningCashPosition * 100) / 100,
        confidence: offset <= 30 ? 'high' : offset <= 60 ? 'medium' : 'low',
      });
    }

    const day30Index = Math.min(29, fullForecast.length - 1);
    const day90Index = Math.min(89, fullForecast.length - 1);
    const warningThreshold = currentCashPosition * 0.2;

    return createApiResponse.success(
      {
        forecast: fullForecast.filter(
          (_, index) => index % (forecastDays > 30 ? 7 : 1) === 0
        ),
        fullForecast,
        metrics: {
          current: {
            cashPosition: Math.round(currentCashPosition * 100) / 100,
            date: formatFinanceDateInput(now),
          },
          thirtyDay: {
            projectedCashPosition:
              fullForecast[day30Index]?.projectedCashPosition || 0,
            totalProjectedIncome: fullForecast
              .slice(0, 30)
              .reduce((sum, item) => sum + item.projectedIncome, 0),
            totalProjectedExpense: fullForecast
              .slice(0, 30)
              .reduce((sum, item) => sum + item.projectedExpense, 0),
          },
          ninetyDay: {
            projectedCashPosition:
              fullForecast[day90Index]?.projectedCashPosition || 0,
            totalProjectedIncome: fullForecast
              .slice(0, 90)
              .reduce((sum, item) => sum + item.projectedIncome, 0),
            totalProjectedExpense: fullForecast
              .slice(0, 90)
              .reduce((sum, item) => sum + item.projectedExpense, 0),
          },
          runway: {
            daysUntilNegative:
              avgDailyNetCashFlow < 0
                ? Math.floor(currentCashPosition / Math.abs(avgDailyNetCashFlow))
                : null,
            isPositive: avgDailyNetCashFlow >= 0,
          },
          averages: {
            dailyIncome: Math.round(avgDailyIncome * 100) / 100,
            dailyExpense: Math.round(avgDailyExpense * 100) / 100,
            dailyNetCashFlow: Math.round(avgDailyNetCashFlow * 100) / 100,
          },
        },
        warnings: fullForecast
          .filter(item => item.projectedCashPosition < warningThreshold)
          .slice(0, 5)
          .map(item => ({
            date: item.date,
            projectedCashPosition: item.projectedCashPosition,
            severity:
              item.projectedCashPosition < 0 ? 'critical' : ('warning' as const),
          })),
        methodology: {
          historicalPeriod: `${historicalMonths} months`,
          forecastPeriod: `${forecastDays} days`,
          model: 'Unified moving average with day-of-week adjustment',
        },
      },
      'Cash flow forecast generated successfully'
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse.validationError(
        getZodErrorMessage(error, 'Invalid cash flow forecast query'),
        error.issues
      );
    }

    console.error('Error generating cash flow forecast:', error);
    return createApiResponse.internalError('Failed to generate cash flow forecast');
  }
});
