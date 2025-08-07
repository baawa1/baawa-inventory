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

    // Get current month stats (including sales and purchases)
    const currentMonthStats = await getPeriodStats(
      currentMonthStart,
      now,
      true,
      true
    );

    // Get previous month stats (including sales and purchases)
    const previousMonthStats = await getPeriodStats(
      previousMonthStart,
      previousMonthEnd,
      true,
      true
    );

    // Get year to date stats (including sales and purchases)
    const yearToDateStats = await getPeriodStats(yearStart, now, true, true);

    // Get recent transactions from all sources
    const recentTransactions = await getRecentTransactions(true, true);

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

// Helper function to get stats for a specific period including sales and purchases
async function getPeriodStats(
  startDate: Date,
  endDate: Date,
  includeSales: boolean = true,
  includePurchases: boolean = true
) {
  // Manual financial transactions
  const manualWhereClause = {
    transactionDate: {
      gte: startDate,
      lte: endDate,
    },
  };

  const [incomeTotal, expenseTotal, transactionCount] = await Promise.all([
    prisma.financialTransaction.aggregate({
      where: { ...manualWhereClause, type: 'INCOME' },
      _sum: { amount: true },
    }),
    prisma.financialTransaction.aggregate({
      where: { ...manualWhereClause, type: 'EXPENSE' },
      _sum: { amount: true },
    }),
    prisma.financialTransaction.count({ where: manualWhereClause }),
  ]);

  let income = Number(incomeTotal._sum.amount) || 0;
  let expenses = Number(expenseTotal._sum.amount) || 0;

  // Add sales data if requested
  if (includeSales) {
    const salesWhereClause = {
      created_at: {
        gte: startDate,
        lte: endDate,
      },
      payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES },
    };

    const salesTotal = await prisma.salesTransaction.aggregate({
      where: salesWhereClause,
      _sum: { total_amount: true },
    });

    const salesIncome = Number(salesTotal._sum.total_amount) || 0;
    income += salesIncome;
  }

  // Add purchase data if requested
  if (includePurchases) {
    const purchaseWhereClause = {
      purchaseDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    const purchaseTotal = await prisma.stockAddition.aggregate({
      where: purchaseWhereClause,
      _sum: { totalCost: true },
    });

    const purchaseExpenses = Number(purchaseTotal._sum.totalCost) || 0;
    expenses += purchaseExpenses;
  }

  const netIncome = income - expenses;

  return {
    income,
    expenses,
    netIncome,
    transactionCount,
  };
}

// Helper function to get recent transactions from all sources
async function getRecentTransactions(
  includeSales: boolean = true,
  includePurchases: boolean = true
) {
  const transactions: any[] = [];

  // Get recent manual financial transactions
  const manualTransactions = await prisma.financialTransaction.findMany({
    include: {
      createdByUser: {
        select: { firstName: true, lastName: true, email: true },
      },
      incomeDetails: true,
      expenseDetails: true,
    },
    orderBy: { transactionDate: 'desc' },
    take: 5,
  });

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

  // Add recent sales if requested
  if (includeSales) {
    const salesTransactions = await prisma.salesTransaction.findMany({
      where: { payment_status: { in: SUCCESSFUL_PAYMENT_STATUSES } },
      include: {
        users: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 3,
    });

    transactions.push(
      ...salesTransactions.map(s => ({
        id: s.id,
        transactionNumber: s.transaction_number,
        type: 'INCOME',
        amount: s.total_amount,
        description: `POS Sale - ${s.customer_name || s.customer_email || 'Walk-in Customer'}`,
        transactionDate: s.created_at,
        paymentMethod: s.payment_method,
        createdBy: s.users,
        incomeSource: 'SALES',
        source: 'sales',
      }))
    );
  }

  // Add recent purchases if requested
  if (includePurchases) {
    const stockAdditions = await prisma.stockAddition.findMany({
      include: {
        createdBy: {
          select: { firstName: true, lastName: true, email: true },
        },
        product: {
          select: { name: true },
        },
      },
      orderBy: { purchaseDate: 'desc' },
      take: 3,
    });

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
  }

  // Sort all transactions by date and return top 5
  return transactions
    .sort(
      (a, b) =>
        new Date(b.transactionDate).getTime() -
        new Date(a.transactionDate).getTime()
    )
    .slice(0, 5);
}
