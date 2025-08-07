import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { handleApiError } from '@/lib/api-error-handler-new';
import { prisma } from '@/lib/db';

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

interface AdvancedAnalyticsData {
  trendAnalysis: TrendAnalysis;
  performanceMetrics: PerformanceMetrics;
  predictions: Predictions;
}

// Helper function to calculate percentage change
function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Helper function to determine trend direction
function getTrendDirection(change: number): 'up' | 'down' | 'stable' {
  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'stable';
}

// Helper function to get period dates
function getPeriodDates(dateRange?: { from?: Date; to?: Date }) {
  const now = new Date();
  let currentStart: Date;
  let currentEnd: Date;

  if (dateRange?.from && dateRange?.to) {
    currentStart = dateRange.from;
    currentEnd = dateRange.to;
  } else {
    // Default to current month
    currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    currentEnd = now;
  }

  const periodDuration = currentEnd.getTime() - currentStart.getTime();
  const previousStart = new Date(currentStart.getTime() - periodDuration);
  const previousEnd = new Date(currentStart.getTime() - 1);

  return { currentStart, currentEnd, previousStart, previousEnd };
}

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const type = searchParams.get('type') || 'all';
    const paymentMethod = searchParams.get('paymentMethod');

    // Parse date range
    const dateRange =
      fromDate && toDate
        ? { from: new Date(fromDate), to: new Date(toDate) }
        : undefined;

    const { currentStart, currentEnd, previousStart, previousEnd } =
      getPeriodDates(dateRange);

    // Build where clause for current period
    const currentWhere: any = {
      createdAt: {
        gte: currentStart,
        lte: currentEnd,
      },
      status: 'COMPLETED',
    };

    // Build where clause for previous period
    const previousWhere: any = {
      createdAt: {
        gte: previousStart,
        lte: previousEnd,
      },
      status: 'COMPLETED',
    };

    // Add type filter if specified
    if (type && type !== 'all') {
      currentWhere.type = type.toUpperCase() as 'EXPENSE' | 'INCOME';
      previousWhere.type = type.toUpperCase() as 'EXPENSE' | 'INCOME';
    }

    // Add payment method filter if specified
    if (paymentMethod && paymentMethod !== 'all') {
      currentWhere.payment_method = paymentMethod.toUpperCase();
      previousWhere.payment_method = paymentMethod.toUpperCase();
    }

    // Get current period data
    const currentData = await prisma.financialTransaction.aggregate({
      where: currentWhere,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get previous period data
    const previousData = await prisma.financialTransaction.aggregate({
      where: previousWhere,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Get expense data for current period
    const currentExpenses = await prisma.financialTransaction.aggregate({
      where: {
        ...currentWhere,
        type: 'EXPENSE',
      },
      _sum: {
        amount: true,
      },
    });

    // Get expense data for previous period
    const previousExpenses = await prisma.financialTransaction.aggregate({
      where: {
        ...previousWhere,
        type: 'EXPENSE',
      },
      _sum: {
        amount: true,
      },
    });

    // Get income data for current period
    const currentIncome = await prisma.financialTransaction.aggregate({
      where: {
        ...currentWhere,
        type: 'INCOME',
      },
      _sum: {
        amount: true,
      },
    });

    // Get income data for previous period
    const previousIncome = await prisma.financialTransaction.aggregate({
      where: {
        ...previousWhere,
        type: 'INCOME',
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate values
    const currentRevenue = Number(currentIncome._sum.amount || 0);
    const previousRevenue = Number(previousIncome._sum.amount || 0);
    const currentExpensesAmount = Number(currentExpenses._sum.amount || 0);
    const previousExpensesAmount = Number(previousExpenses._sum.amount || 0);
    const currentProfit = currentRevenue - currentExpensesAmount;
    const previousProfit = previousRevenue - previousExpensesAmount;
    const currentTransactions = currentData._count.id || 0;
    const previousTransactions = previousData._count.id || 0;

    // Calculate trend analysis
    const revenueChange = calculateChange(currentRevenue, previousRevenue);
    const expensesChange = calculateChange(
      currentExpensesAmount,
      previousExpensesAmount
    );
    const profitChange = calculateChange(currentProfit, previousProfit);
    const transactionsChange = calculateChange(
      currentTransactions,
      previousTransactions
    );

    const trendAnalysis: TrendAnalysis = {
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        change: revenueChange,
        trend: getTrendDirection(revenueChange),
      },
      expenses: {
        current: currentExpensesAmount,
        previous: previousExpensesAmount,
        change: expensesChange,
        trend: getTrendDirection(expensesChange),
      },
      profit: {
        current: currentProfit,
        previous: previousProfit,
        change: profitChange,
        trend: getTrendDirection(profitChange),
      },
      transactions: {
        current: currentTransactions,
        previous: previousTransactions,
        change: transactionsChange,
        trend: getTrendDirection(transactionsChange),
      },
    };

    // Calculate performance metrics
    const performanceMetrics: PerformanceMetrics = {
      profitMargin:
        currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0,
      averageTransactionValue:
        currentTransactions > 0 ? currentRevenue / currentTransactions : 0,
      revenuePerTransaction:
        currentTransactions > 0 ? currentRevenue / currentTransactions : 0,
      expenseRatio:
        currentRevenue > 0 ? (currentExpensesAmount / currentRevenue) * 100 : 0,
    };

    // Calculate predictions (simple linear projection based on current trends)
    const growthRate = revenueChange;
    const predictions: Predictions = {
      nextMonthRevenue: currentRevenue * (1 + growthRate / 100),
      nextMonthExpenses: currentExpensesAmount * (1 + expensesChange / 100),
      nextMonthProfit:
        currentRevenue * (1 + growthRate / 100) -
        currentExpensesAmount * (1 + expensesChange / 100),
      growthRate: growthRate,
    };

    const advancedAnalyticsData: AdvancedAnalyticsData = {
      trendAnalysis,
      performanceMetrics,
      predictions,
    };

    return NextResponse.json({
      success: true,
      data: advancedAnalyticsData,
    });
  } catch (error) {
    return handleApiError(error, 500);
  }
});
