import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { createApiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { SUCCESSFUL_PAYMENT_STATUSES } from '@/lib/constants';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    if (!hasPermission(request.user.role, 'FINANCIAL_ANALYTICS')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to view profit margins'
      );
    }

    const { searchParams } = new URL(request.url);
    const periodMonths = parseInt(searchParams.get('months') || '12');

    const now = new Date();
    const periods: Array<{
      label: string;
      startDate: Date;
      endDate: Date;
    }> = [];

    // Generate monthly periods
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

    // Calculate margins for each period
    const marginData = await Promise.all(
      periods.map(async period => {
        const [financialIncome, financialExpense, sales, cogs] = await Promise.all([
          // Manual income
          prisma.financialTransaction.aggregate({
            where: {
              type: 'INCOME',
              status: { in: ['COMPLETED', 'APPROVED'] },
              transactionDate: { gte: period.startDate, lte: period.endDate },
            },
            _sum: { amount: true },
          }),
          // Manual expenses
          prisma.financialTransaction.aggregate({
            where: {
              type: 'EXPENSE',
              status: { in: ['COMPLETED', 'APPROVED'] },
              transactionDate: { gte: period.startDate, lte: period.endDate },
            },
            _sum: { amount: true },
          }),
          // Sales income
          prisma.salesTransaction.aggregate({
            where: {
              payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES },
              created_at: { gte: period.startDate, lte: period.endDate },
            },
            _sum: { total_amount: true },
          }),
          // Cost of goods (stock purchases)
          prisma.stockAddition.aggregate({
            where: {
              purchaseDate: { gte: period.startDate, lte: period.endDate },
            },
            _sum: { totalCost: true },
          }),
        ]);

        const totalRevenue =
          (Number(financialIncome._sum.amount) || 0) +
          (Number(sales._sum.total_amount) || 0);

        const totalCOGS = Number(cogs._sum.totalCost) || 0;
        const totalExpenses = Number(financialExpense._sum.amount) || 0;

        const grossProfit = totalRevenue - totalCOGS;
        const netProfit = totalRevenue - totalCOGS - totalExpenses;

        const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        const operatingMargin =
          totalRevenue > 0
            ? ((totalRevenue - totalExpenses) / totalRevenue) * 100
            : 0;

        return {
          period: period.label,
          revenue: totalRevenue,
          cogs: totalCOGS,
          operatingExpenses: totalExpenses,
          grossProfit,
          netProfit,
          grossMargin: Math.round(grossMargin * 100) / 100,
          netMargin: Math.round(netMargin * 100) / 100,
          operatingMargin: Math.round(operatingMargin * 100) / 100,
        };
      })
    );

    // Calculate by income source
    const incomeSourceBreakdown = await prisma.incomeDetail.groupBy({
      by: ['incomeSource'],
      where: {
        transaction: {
          status: { in: ['COMPLETED', 'APPROVED'] },
          transactionDate: {
            gte: periods[0].startDate,
            lte: periods[periods.length - 1].endDate,
          },
        },
      },
      _count: true,
    });

    const sourceMarginsFromDb = await Promise.all(
      incomeSourceBreakdown.map(async source => {
        const sourceIncome = await prisma.financialTransaction.aggregate({
          where: {
            type: 'INCOME',
            status: { in: ['COMPLETED', 'APPROVED'] },
            incomeDetails: { incomeSource: source.incomeSource },
          },
          _sum: { amount: true },
        });

        return {
          source: source.incomeSource as string,
          revenue: Number(sourceIncome._sum.amount) || 0,
          transactionCount: source._count,
        };
      })
    );

    // Add sales as a source
    const salesTotal = await prisma.salesTransaction.aggregate({
      where: {
        payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES },
        created_at: {
          gte: periods[0].startDate,
          lte: periods[periods.length - 1].endDate,
        },
      },
      _sum: { total_amount: true },
      _count: true,
    });

    const sourceMargins: Array<{ source: string; revenue: number; transactionCount: number }> = [
      ...sourceMarginsFromDb,
      {
        source: 'POS_SALES',
        revenue: Number(salesTotal._sum.total_amount) || 0,
        transactionCount: salesTotal._count || 0,
      },
    ];

    // Calculate totals and averages
    const totals = marginData.reduce(
      (acc, m) => ({
        revenue: acc.revenue + m.revenue,
        grossProfit: acc.grossProfit + m.grossProfit,
        netProfit: acc.netProfit + m.netProfit,
      }),
      { revenue: 0, grossProfit: 0, netProfit: 0 }
    );

    const averageGrossMargin =
      totals.revenue > 0 ? (totals.grossProfit / totals.revenue) * 100 : 0;
    const averageNetMargin =
      totals.revenue > 0 ? (totals.netProfit / totals.revenue) * 100 : 0;

    return createApiResponse.success(
      {
        trends: marginData,
        bySource: sourceMargins.sort((a, b) => b.revenue - a.revenue),
        summary: {
          totalRevenue: totals.revenue,
          totalGrossProfit: totals.grossProfit,
          totalNetProfit: totals.netProfit,
          averageGrossMargin: Math.round(averageGrossMargin * 100) / 100,
          averageNetMargin: Math.round(averageNetMargin * 100) / 100,
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
    console.error('Error fetching profit margins:', error);
    return createApiResponse.internalError('Failed to fetch profit margin data');
  }
});
