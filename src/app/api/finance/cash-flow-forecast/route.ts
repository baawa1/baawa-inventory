import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { createApiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { SUCCESSFUL_PAYMENT_STATUSES } from '@/lib/constants';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    if (!hasPermission(request.user.role, 'FINANCIAL_ANALYTICS')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to view cash flow forecast'
      );
    }

    const { searchParams } = new URL(request.url);
    const forecastDays = parseInt(searchParams.get('days') || '90');
    const historicalMonths = parseInt(searchParams.get('historicalMonths') || '6');

    const now = new Date();
    const historicalStart = new Date(
      now.getFullYear(),
      now.getMonth() - historicalMonths,
      1
    );

    // Get historical data for pattern analysis
    const [historicalIncome, historicalExpenses, historicalSales, historicalPurchases] =
      await Promise.all([
        prisma.financialTransaction.findMany({
          where: {
            type: 'INCOME',
            status: { in: ['COMPLETED', 'APPROVED'] },
            transactionDate: { gte: historicalStart, lte: now },
          },
          select: { amount: true, transactionDate: true },
        }),
        prisma.financialTransaction.findMany({
          where: {
            type: 'EXPENSE',
            status: { in: ['COMPLETED', 'APPROVED'] },
            transactionDate: { gte: historicalStart, lte: now },
          },
          select: { amount: true, transactionDate: true },
        }),
        prisma.salesTransaction.findMany({
          where: {
            payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES },
            created_at: { gte: historicalStart, lte: now },
          },
          select: { total_amount: true, created_at: true },
        }),
        prisma.stockAddition.findMany({
          where: {
            purchaseDate: { gte: historicalStart, lte: now },
          },
          select: { totalCost: true, purchaseDate: true },
        }),
      ]);

    // Calculate daily averages
    const daysOfHistory = Math.ceil(
      (now.getTime() - historicalStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    const totalHistoricalIncome =
      historicalIncome.reduce((sum, t) => sum + Number(t.amount), 0) +
      historicalSales.reduce((sum, s) => sum + Number(s.total_amount), 0);

    const totalHistoricalExpenses =
      historicalExpenses.reduce((sum, t) => sum + Number(t.amount), 0) +
      historicalPurchases.reduce((sum, p) => sum + Number(p.totalCost), 0);

    const avgDailyIncome = totalHistoricalIncome / daysOfHistory;
    const avgDailyExpense = totalHistoricalExpenses / daysOfHistory;
    const avgDailyNetCashFlow = avgDailyIncome - avgDailyExpense;

    // Calculate day-of-week patterns
    const dayOfWeekIncome: number[] = Array(7).fill(0);
    const dayOfWeekCounts: number[] = Array(7).fill(0);

    [...historicalIncome, ...historicalSales.map(s => ({ amount: s.total_amount, transactionDate: s.created_at }))].forEach(t => {
      if (t.transactionDate) {
        const day = new Date(t.transactionDate).getDay();
        dayOfWeekIncome[day] += Number(t.amount);
        dayOfWeekCounts[day]++;
      }
    });

    // Normalize to get day-of-week multipliers
    const dayMultipliers = dayOfWeekIncome.map((inc, i) => {
      const avgInc = inc / Math.max(1, dayOfWeekCounts[i]);
      return avgDailyIncome > 0 ? avgInc / avgDailyIncome : 1;
    });

    // Get current estimated cash position
    const allTimeData = await Promise.all([
      prisma.financialTransaction.aggregate({
        where: { type: 'INCOME', status: { in: ['COMPLETED', 'APPROVED'] } },
        _sum: { amount: true },
      }),
      prisma.financialTransaction.aggregate({
        where: { type: 'EXPENSE', status: { in: ['COMPLETED', 'APPROVED'] } },
        _sum: { amount: true },
      }),
      prisma.salesTransaction.aggregate({
        where: { payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES } },
        _sum: { total_amount: true },
      }),
      prisma.stockAddition.aggregate({
        _sum: { totalCost: true },
      }),
    ]);

    const currentCashPosition =
      (Number(allTimeData[0]._sum.amount) || 0) +
      (Number(allTimeData[2]._sum.total_amount) || 0) -
      (Number(allTimeData[1]._sum.amount) || 0) -
      (Number(allTimeData[3]._sum.totalCost) || 0);

    // Generate forecast
    const forecast: Array<{
      date: string;
      projectedIncome: number;
      projectedExpense: number;
      projectedNetCashFlow: number;
      projectedCashPosition: number;
      confidence: 'high' | 'medium' | 'low';
    }> = [];

    let runningCashPosition = currentCashPosition;

    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date(now);
      forecastDate.setDate(forecastDate.getDate() + i);
      const dayOfWeek = forecastDate.getDay();

      // Apply day-of-week multiplier for more realistic projections
      const multiplier = dayMultipliers[dayOfWeek] || 1;
      const projectedIncome = avgDailyIncome * multiplier;
      const projectedExpense = avgDailyExpense;
      const projectedNetCashFlow = projectedIncome - projectedExpense;

      runningCashPosition += projectedNetCashFlow;

      // Confidence decreases over time
      const confidence: 'high' | 'medium' | 'low' =
        i <= 30 ? 'high' : i <= 60 ? 'medium' : 'low';

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        projectedIncome: Math.round(projectedIncome * 100) / 100,
        projectedExpense: Math.round(projectedExpense * 100) / 100,
        projectedNetCashFlow: Math.round(projectedNetCashFlow * 100) / 100,
        projectedCashPosition: Math.round(runningCashPosition * 100) / 100,
        confidence,
      });
    }

    // Calculate key forecast metrics
    const endOfMonthIdx = Math.min(29, forecast.length - 1);
    const endOfQuarterIdx = Math.min(89, forecast.length - 1);

    const metrics = {
      current: {
        cashPosition: Math.round(currentCashPosition * 100) / 100,
        date: now.toISOString().split('T')[0],
      },
      thirtyDay: {
        projectedCashPosition: forecast[endOfMonthIdx]?.projectedCashPosition || 0,
        totalProjectedIncome:
          forecast.slice(0, 30).reduce((sum, f) => sum + f.projectedIncome, 0),
        totalProjectedExpense:
          forecast.slice(0, 30).reduce((sum, f) => sum + f.projectedExpense, 0),
      },
      ninetyDay: {
        projectedCashPosition: forecast[endOfQuarterIdx]?.projectedCashPosition || 0,
        totalProjectedIncome:
          forecast.slice(0, 90).reduce((sum, f) => sum + f.projectedIncome, 0),
        totalProjectedExpense:
          forecast.slice(0, 90).reduce((sum, f) => sum + f.projectedExpense, 0),
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
    };

    // Identify potential cash crunches (days where cash position drops below threshold)
    const warningThreshold = currentCashPosition * 0.2; // 20% of current position
    const warnings = forecast
      .filter(f => f.projectedCashPosition < warningThreshold)
      .slice(0, 5)
      .map(f => ({
        date: f.date,
        projectedCashPosition: f.projectedCashPosition,
        severity: f.projectedCashPosition < 0 ? 'critical' : 'warning',
      }));

    return createApiResponse.success(
      {
        forecast: forecast.filter((_, i) => i % (forecastDays > 30 ? 7 : 1) === 0), // Weekly for long forecasts
        fullForecast: forecast,
        metrics,
        warnings,
        methodology: {
          historicalPeriod: `${historicalMonths} months`,
          forecastPeriod: `${forecastDays} days`,
          model: 'Moving average with day-of-week adjustment',
        },
      },
      'Cash flow forecast generated successfully'
    );
  } catch (error) {
    console.error('Error generating cash flow forecast:', error);
    return createApiResponse.internalError('Failed to generate cash flow forecast');
  }
});
