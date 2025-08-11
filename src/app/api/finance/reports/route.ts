import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createApiResponse } from '@/lib/api-response';
import { ERROR_MESSAGES } from '@/lib/constants';

// Validation schema for report parameters
const reportParamsSchema = z.object({
  period: z
    .enum(['weekly', 'monthly', 'quarterly', 'yearly'])
    .default('monthly'),
  type: z.enum(['all', 'income', 'expense']).default('all'),
  paymentMethod: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const GET = withAuth(async function (request: AuthenticatedRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const validatedParams = reportParamsSchema.parse({
      period: searchParams.get('period'),
      type: searchParams.get('type'),
      paymentMethod: searchParams.get('paymentMethod'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
    });

    const { period, type, paymentMethod, dateFrom, dateTo } = validatedParams;

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (period) {
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Use provided date range if available
    if (dateFrom && dateTo) {
      startDate = new Date(dateFrom);
      endDate = new Date(dateTo);
    }

    // Build where clause for transactions
    const whereClause: any = {
      transactionDate: {
        gte: startDate,
        lte: endDate,
      },
      status: 'COMPLETED',
    };

    if (type !== 'all') {
      whereClause.type = type.toUpperCase();
    }

    if (paymentMethod && paymentMethod !== 'all') {
      whereClause.paymentMethod = paymentMethod;
    }

    // Get financial transactions for the period
    const transactions = await prisma.financialTransaction.findMany({
      where: whereClause,
      include: {
        incomeDetails: true,
        expenseDetails: true,
      },
      orderBy: {
        transactionDate: 'asc',
      },
    });

    // Calculate profit/loss data
    const incomeTransactions = transactions.filter(t => t.type === 'INCOME');
    const expenseTransactions = transactions.filter(t => t.type === 'EXPENSE');

    const totalIncome = incomeTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );
    const totalExpenses = expenseTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    // Categorize expenses
    const costOfGoods = expenseTransactions
      .filter(t => t.expenseDetails?.expenseType === 'INVENTORY_PURCHASES')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const operatingExpenses = expenseTransactions
      .filter(t => t.expenseDetails?.expenseType !== 'INVENTORY_PURCHASES')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate other income (non-sales income)
    const salesIncome = incomeTransactions
      .filter(t => t.incomeDetails?.incomeSource === 'SALES')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const otherIncome = totalIncome - salesIncome;

    // Calculate profits
    const grossProfit = salesIncome - costOfGoods;
    const netProfit = totalIncome - totalExpenses;

    // Generate cash flow data
    const cashFlowData = {
      operatingActivities: {
        netIncome: netProfit,
        depreciation: 0, // Would need to be calculated from asset depreciation
        changesInWorkingCapital: 0, // Would need inventory and receivables data
        netOperatingCashFlow: netProfit,
      },
      investingActivities: {
        capitalExpenditures: expenseTransactions
          .filter(t => t.expenseDetails?.expenseType === 'MAINTENANCE')
          .reduce((sum, t) => sum + Number(t.amount), 0),
        investments: 0, // Would need investment transaction data
        netInvestingCashFlow: 0,
      },
      financingActivities: {
        loans: incomeTransactions
          .filter(t => t.incomeDetails?.incomeSource === 'INVESTMENTS')
          .reduce((sum, t) => sum + Number(t.amount), 0),
        repayments: expenseTransactions
          .filter(t => t.expenseDetails?.expenseType === 'OTHER')
          .reduce((sum, t) => sum + Number(t.amount), 0),
        netFinancingCashFlow: 0,
      },
    };

    // Calculate net investing and financing cash flows
    cashFlowData.investingActivities.netInvestingCashFlow =
      -cashFlowData.investingActivities.capitalExpenditures -
      cashFlowData.investingActivities.investments;

    cashFlowData.financingActivities.netFinancingCashFlow =
      cashFlowData.financingActivities.loans -
      cashFlowData.financingActivities.repayments;

    // Calculate total cash flow
    const totalCashFlow =
      cashFlowData.operatingActivities.netOperatingCashFlow +
      cashFlowData.investingActivities.netInvestingCashFlow +
      cashFlowData.financingActivities.netFinancingCashFlow;

    const profitLossData = {
      revenue: {
        sales: salesIncome,
        otherIncome: otherIncome,
        totalRevenue: totalIncome,
      },
      expenses: {
        costOfGoods: costOfGoods,
        operatingExpenses: operatingExpenses,
        totalExpenses: totalExpenses,
      },
      grossProfit: grossProfit,
      netProfit: netProfit,
    };

    // Get payment method distribution
    const paymentMethodStats = await prisma.financialTransaction.groupBy({
      by: ['paymentMethod'],
      where: whereClause,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const paymentMethodData = paymentMethodStats.map(stat => ({
      method: stat.paymentMethod,
      amount: Number(stat._sum.amount) || 0,
      count: stat._count.id,
    }));

    // Get monthly trends for the period
    const monthlyTrends = await prisma.financialTransaction.groupBy({
      by: ['transactionDate'],
      where: whereClause,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const trendData = monthlyTrends.map(stat => ({
      date: stat.transactionDate?.toISOString().split('T')[0] || '',
      amount: Number(stat._sum.amount) || 0,
      count: stat._count.id,
    }));

    const reportData = {
      profitLoss: profitLossData,
      cashFlow: cashFlowData,
      totalCashFlow,
      paymentMethods: paymentMethodData,
      trends: trendData,
      period,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      summary: {
        totalTransactions: transactions.length,
        totalIncome,
        totalExpenses,
        netProfit,
        grossProfit,
      },
    };

    logger.info('Financial report generated', {
      userId: request.user.id,
      period,
      type,
      transactionCount: transactions.length,
    });

    return createApiResponse.success(
      reportData,
      'Financial report generated successfully'
    );
  } catch (error) {
    logger.error('Error generating financial report', {
      error: error instanceof Error ? error.message : String(error),
      userId: request.user?.id,
    });

    if (error instanceof z.ZodError) {
      return createApiResponse.validationError(
        ERROR_MESSAGES.VALIDATION_ERROR,
        error.errors
      );
    }

    return createApiResponse.internalError(ERROR_MESSAGES.INTERNAL_ERROR);
  }
});
