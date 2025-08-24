import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { createApiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { SUCCESSFUL_PAYMENT_STATUSES } from '@/lib/constants';

// GET /api/finance/summary - Get financial summary statistics with real data including sales and purchases
export const GET = withAuth(async (_request: AuthenticatedRequest) => {
  try {
    // Get current month date range
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Optimized: Get all period stats in parallel with consolidated queries
    const [
      currentMonthStats,
      previousMonthStats,
      yearToDateStats,
      recentTransactions,
    ] = await Promise.all([
      getPeriodStatsOptimized(currentMonthStart, now),
      getPeriodStatsOptimized(previousMonthStart, previousMonthEnd),
      getPeriodStatsOptimized(yearStart, now),
      getRecentTransactionsOptimized(),
    ]);

    const summary = {
      currentMonth: currentMonthStats,
      previousMonth: previousMonthStats,
      yearToDate: yearToDateStats,
      recentTransactions,
      dataSources: {
        includeSales: true,
        includePurchases: true,
      },
    };

    return createApiResponse.success(summary);
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    return createApiResponse.internalError('Failed to fetch financial summary');
  }
});

// Optimized helper function to get stats for a specific period with consolidated queries
async function getPeriodStatsOptimized(startDate: Date, endDate: Date) {
  // Single query to get all financial transaction stats for the period
  const financialStats = await prisma.financialTransaction.groupBy({
    by: ['type'],
    where: {
      transactionDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      amount: true,
    },
    _count: true,
  });

  // Single query to get sales total for the period
  const salesTotal = await prisma.salesTransaction.aggregate({
    where: {
      created_at: {
        gte: startDate,
        lte: endDate,
      },
      payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES },
    },
    _sum: { total_amount: true },
  });

  // Single query to get purchase total for the period
  const purchaseTotal = await prisma.stockAddition.aggregate({
    where: {
      purchaseDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: { totalCost: true },
  });

  // Calculate totals from the grouped results
  let income = 0;
  let expenses = 0;
  let transactionCount = 0;

  financialStats.forEach(stat => {
    const amount = Number(stat._sum.amount) || 0;
    if (stat.type === 'INCOME') {
      income += amount;
    } else {
      expenses += amount;
    }
    transactionCount += stat._count;
  });

  // Add sales income
  income += Number(salesTotal._sum.total_amount) || 0;

  // Add purchase expenses
  expenses += Number(purchaseTotal._sum.totalCost) || 0;

  const netIncome = income - expenses;

  return {
    income,
    expenses,
    netIncome,
    transactionCount,
  };
}

// Optimized helper function to get recent transactions with better query structure
async function getRecentTransactionsOptimized() {
  // Get recent transactions from all sources in parallel with optimized queries
  const [manualTransactions, salesTransactions, stockAdditions] =
    await Promise.all([
      // Manual financial transactions with minimal includes
      prisma.financialTransaction.findMany({
        select: {
          id: true,
          transactionNumber: true,
          type: true,
          amount: true,
          description: true,
          transactionDate: true,
          paymentMethod: true,
          createdByUser: {
            select: { firstName: true, lastName: true, email: true },
          },
          incomeDetails: {
            select: { incomeSource: true },
          },
          expenseDetails: {
            select: { expenseType: true },
          },
        },
        orderBy: { transactionDate: 'desc' },
        take: 5,
      }),

      // Sales transactions with minimal includes
      prisma.salesTransaction.findMany({
        where: { payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES } },
        select: {
          id: true,
          transaction_number: true,
          total_amount: true,
          created_at: true,
          payment_method: true,
          users: {
            select: { firstName: true, lastName: true, email: true },
          },
          customer: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { created_at: 'desc' },
        take: 3,
      }),

      // Stock additions with minimal includes
      prisma.stockAddition.findMany({
        select: {
          id: true,
          totalCost: true,
          purchaseDate: true,
          referenceNo: true,
          createdBy: {
            select: { firstName: true, lastName: true, email: true },
          },
          product: {
            select: { name: true },
          },
        },
        orderBy: { purchaseDate: 'desc' },
        take: 3,
      }),
    ]);

  const transactions: any[] = [];

  // Transform manual transactions
  transactions.push(
    ...manualTransactions.map(t => ({
      id: t.id,
      transactionNumber: t.transactionNumber,
      type: t.type,
      amount: t.amount,
      description: t.description,
      transactionDate: t.transactionDate,
      paymentMethod: t.paymentMethod,
      createdBy: t.createdByUser,
      incomeSource: t.incomeDetails?.incomeSource,
      expenseType: t.expenseDetails?.expenseType,
      source: 'manual',
    }))
  );

  // Transform sales transactions
  transactions.push(
    ...salesTransactions.map(s => ({
      id: s.id,
      transactionNumber: s.transaction_number,
      type: 'INCOME',
      amount: s.total_amount,
      description: `POS Sale - ${s.customer?.name || s.customer?.email || 'Walk-in Customer'}`,
      transactionDate: s.created_at,
      paymentMethod: s.payment_method,
      createdBy: s.users,
      incomeSource: 'SALES',
      source: 'sales',
    }))
  );

  // Transform stock additions
  transactions.push(
    ...stockAdditions.map(sa => ({
      id: sa.id,
      transactionNumber: sa.referenceNo || `STOCK-${sa.id}`,
      type: 'EXPENSE',
      amount: sa.totalCost,
      description: `Inventory Purchase - ${sa.product.name}`,
      transactionDate: sa.purchaseDate,
      paymentMethod: 'BANK_TRANSFER',
      createdBy: sa.createdBy,
      expenseType: 'INVENTORY_PURCHASES',
      source: 'purchase',
    }))
  );

  // Sort all transactions by date and return top 5
  return transactions
    .sort(
      (a, b) =>
        new Date(b.transactionDate).getTime() -
        new Date(a.transactionDate).getTime()
    )
    .slice(0, 5);
}
