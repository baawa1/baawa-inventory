import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { createApiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { SUCCESSFUL_PAYMENT_STATUSES } from '@/lib/constants';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    if (!hasPermission(request.user.role, 'FINANCIAL_ANALYTICS')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to view financial KPIs'
      );
    }

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '3');

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth() - months, 1);

    // Get all financial data for the period
    const [financialData, salesData, stockData] = await Promise.all([
      prisma.financialTransaction.groupBy({
        by: ['type'],
        where: {
          transactionDate: { gte: periodStart, lte: now },
          status: { in: ['COMPLETED', 'APPROVED'] },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.salesTransaction.aggregate({
        where: {
          created_at: { gte: periodStart, lte: now },
          payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES },
        },
        _sum: { total_amount: true },
        _count: true,
      }),
      prisma.stockAddition.aggregate({
        where: {
          purchaseDate: { gte: periodStart, lte: now },
        },
        _sum: { totalCost: true },
        _count: true,
      }),
    ]);

    // Calculate totals
    let manualIncome = 0;
    let manualExpense = 0;
    financialData.forEach(d => {
      if (d.type === 'INCOME') manualIncome = Number(d._sum.amount) || 0;
      if (d.type === 'EXPENSE') manualExpense = Number(d._sum.amount) || 0;
    });

    const salesIncome = Number(salesData._sum.total_amount) || 0;
    const purchaseExpense = Number(stockData._sum.totalCost) || 0;

    const totalIncome = manualIncome + salesIncome;
    const totalExpenses = manualExpense + purchaseExpense;
    const netProfit = totalIncome - totalExpenses;

    // Calculate KPIs
    const daysInPeriod = Math.ceil(
      (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Burn Rate: Average daily expense
    const dailyBurnRate = totalExpenses / daysInPeriod;
    const monthlyBurnRate = dailyBurnRate * 30;

    // Get current cash position (simplified - sum of all net income)
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

    const allTimeIncome =
      (Number(allTimeData[0]._sum.amount) || 0) +
      (Number(allTimeData[2]._sum.total_amount) || 0);
    const allTimeExpense =
      (Number(allTimeData[1]._sum.amount) || 0) +
      (Number(allTimeData[3]._sum.totalCost) || 0);
    const estimatedCashPosition = allTimeIncome - allTimeExpense;

    // Runway: Months of cash remaining at current burn rate
    const runwayMonths =
      monthlyBurnRate > 0
        ? Math.max(0, estimatedCashPosition / monthlyBurnRate)
        : Infinity;

    // Operating Expense Ratio: OpEx as % of revenue
    const operatingExpenseRatio =
      totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

    // Profit Margin
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    // Break-even point (monthly revenue needed to cover monthly expenses)
    const breakEvenRevenue = monthlyBurnRate;

    // Revenue per day
    const dailyRevenue = totalIncome / daysInPeriod;

    // Days to break-even (if currently in loss)
    const daysToBreakEven =
      netProfit < 0 && dailyRevenue > dailyBurnRate
        ? Math.abs(netProfit) / (dailyRevenue - dailyBurnRate)
        : 0;

    const kpis = {
      period: {
        startDate: periodStart.toISOString(),
        endDate: now.toISOString(),
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
        months: runwayMonths === Infinity ? null : Math.round(runwayMonths * 10) / 10,
        estimatedCashPosition: Math.round(estimatedCashPosition * 100) / 100,
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
        operatingExpenseRatio: Math.round(operatingExpenseRatio * 100) / 100,
        breakEvenRevenue: Math.round(breakEvenRevenue * 100) / 100,
        dailyRevenue: Math.round(dailyRevenue * 100) / 100,
        daysToBreakEven: daysToBreakEven > 0 ? Math.ceil(daysToBreakEven) : null,
      },
      health: {
        score: calculateHealthScore(profitMargin, runwayMonths, operatingExpenseRatio),
        indicators: {
          profitability: profitMargin > 0 ? 'positive' : 'negative',
          cashflow: runwayMonths > 6 ? 'healthy' : runwayMonths > 3 ? 'moderate' : 'low',
          efficiency: operatingExpenseRatio < 80 ? 'efficient' : 'high-cost',
        },
      },
    };

    return createApiResponse.success(kpis, 'Financial KPIs calculated successfully');
  } catch (error) {
    console.error('Error calculating financial KPIs:', error);
    return createApiResponse.internalError('Failed to calculate financial KPIs');
  }
});

function calculateHealthScore(
  profitMargin: number,
  runwayMonths: number,
  opExRatio: number
): number {
  let score = 50; // Base score

  // Profitability component (max 30 points)
  if (profitMargin > 20) score += 30;
  else if (profitMargin > 10) score += 20;
  else if (profitMargin > 0) score += 10;
  else if (profitMargin > -10) score += 0;
  else score -= 10;

  // Runway component (max 20 points)
  if (runwayMonths === Infinity || runwayMonths > 12) score += 20;
  else if (runwayMonths > 6) score += 15;
  else if (runwayMonths > 3) score += 5;
  else score -= 10;

  // Efficiency component (max 10 points)
  if (opExRatio < 60) score += 10;
  else if (opExRatio < 80) score += 5;
  else if (opExRatio > 100) score -= 10;

  return Math.max(0, Math.min(100, score));
}
