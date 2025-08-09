import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { createApiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { INCOME_SOURCES, EXPENSE_TYPES } from '@/lib/constants/finance';
import { SUCCESSFUL_PAYMENT_STATUSES } from '@/lib/constants';

// GET /api/finance/reports - Get financial reports with real data including sales and purchases
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'FINANCIAL_SUMMARY';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeSales = searchParams.get('includeSales') !== 'false'; // Default to true
    const includePurchases = searchParams.get('includePurchases') !== 'false'; // Default to true

    let reportData;

    switch (reportType) {
      case 'FINANCIAL_SUMMARY':
        reportData = await getFinancialSummary(
          startDate,
          endDate,
          includeSales,
          includePurchases
        );
        break;
      case 'INCOME_REPORT':
        reportData = await getIncomeReport(startDate, endDate, includeSales);
        break;
      case 'EXPENSE_REPORT':
        reportData = await getExpenseReport(
          startDate,
          endDate,
          includePurchases
        );
        break;
      case 'CASH_FLOW':
        reportData = await getCashFlowReport(
          startDate,
          endDate,
          includeSales,
          includePurchases
        );
        break;
      default:
        return createApiResponse.error('Invalid report type', 400);
    }

    return createApiResponse.success(reportData);
  } catch (error) {
    console.error('Error generating finance report:', error);
    return createApiResponse.internalError('Failed to generate report');
  }
});

// Get financial summary with real calculations including sales and purchases
async function getFinancialSummary(
  startDate?: string | null,
  endDate?: string | null,
  includeSales: boolean = true,
  includePurchases: boolean = true
) {
  const whereClause: any = {};

  if (startDate || endDate) {
    whereClause.transactionDate = {};
    if (startDate) whereClause.transactionDate.gte = new Date(startDate);
    if (endDate) whereClause.transactionDate.lte = new Date(endDate);
  }

  // Get manual financial transactions
  const [incomeTotal, expenseTotal, transactionCount] = await Promise.all([
    prisma.financialTransaction.aggregate({
      where: { ...whereClause, type: 'INCOME' },
      _sum: { amount: true },
    }),
    prisma.financialTransaction.aggregate({
      where: { ...whereClause, type: 'EXPENSE' },
      _sum: { amount: true },
    }),
    prisma.financialTransaction.count({ where: whereClause }),
  ]);

  let totalIncome = Number(incomeTotal._sum.amount) || 0;
  let totalExpenses = Number(expenseTotal._sum.amount) || 0;

  // Add sales data if requested
  if (includeSales) {
    const salesWhereClause: any = {};
    if (startDate || endDate) {
      salesWhereClause.created_at = {};
      if (startDate) salesWhereClause.created_at.gte = new Date(startDate);
      if (endDate) salesWhereClause.created_at.lte = new Date(endDate);
    }
    salesWhereClause.payment_status = { in: SUCCESSFUL_PAYMENT_STATUSES };

    const salesTotal = await prisma.salesTransaction.aggregate({
      where: salesWhereClause,
      _sum: { total_amount: true },
    });

    const salesIncome = Number(salesTotal._sum.total_amount) || 0;
    totalIncome += salesIncome;
  }

  // Add purchase data if requested
  if (includePurchases) {
    const purchaseWhereClause: any = {};
    if (startDate || endDate) {
      purchaseWhereClause.purchaseDate = {};
      if (startDate) purchaseWhereClause.purchaseDate.gte = new Date(startDate);
      if (endDate) purchaseWhereClause.purchaseDate.lte = new Date(endDate);
    }

    const purchaseTotal = await prisma.stockAddition.aggregate({
      where: purchaseWhereClause,
      _sum: { totalCost: true },
    });

    const purchaseExpenses = Number(purchaseTotal._sum.totalCost) || 0;
    totalExpenses += purchaseExpenses;
  }

  const netIncome = totalIncome - totalExpenses;

  // Get recent transactions (both manual and sales/purchases)
  const recentTransactions = await getRecentTransactions(
    startDate,
    endDate,
    includeSales,
    includePurchases
  );

  return {
    totalIncome,
    totalExpenses,
    netIncome,
    transactionCount,
    recentTransactions,
    dataSources: {
      manualTransactions: transactionCount,
      includeSales,
      includePurchases,
    },
  };
}

// Get income report with real data including sales
async function getIncomeReport(
  startDate?: string | null,
  endDate?: string | null,
  includeSales: boolean = true
) {
  const whereClause: any = { type: 'INCOME' };

  if (startDate || endDate) {
    whereClause.transactionDate = {};
    if (startDate) whereClause.transactionDate.gte = new Date(startDate);
    if (endDate) whereClause.transactionDate.lte = new Date(endDate);
  }

  // Get manual income transactions
  const incomeBySource = await prisma.financialTransaction.findMany({
    where: whereClause,
    include: {
      incomeDetails: true,
    },
  });

  // Group by income source
  const incomeBreakdown = incomeBySource.reduce(
    (acc, transaction) => {
      const source = transaction.incomeDetails?.incomeSource || 'Other';
      if (!acc[source]) {
        acc[source] = { source, amount: 0, count: 0 };
      }
      acc[source].amount += Number(transaction.amount);
      acc[source].count += 1;
      return acc;
    },
    {} as Record<string, { source: string; amount: number; count: number }>
  );

  // Add sales data if requested
  if (includeSales) {
    const salesWhereClause: any = {};
    if (startDate || endDate) {
      salesWhereClause.created_at = {};
      if (startDate) salesWhereClause.created_at.gte = new Date(startDate);
      if (endDate) salesWhereClause.created_at.lte = new Date(endDate);
    }
    salesWhereClause.payment_status = { in: SUCCESSFUL_PAYMENT_STATUSES };

    const salesTransactions = await prisma.salesTransaction.findMany({
      where: salesWhereClause,
    });

    const salesAmount = salesTransactions.reduce(
      (sum, sale) => sum + Number(sale.total_amount),
      0
    );
    const salesCount = salesTransactions.length;

    if (salesAmount > 0) {
      incomeBreakdown['SALES'] = {
        source: 'SALES',
        amount: salesAmount,
        count: salesCount,
      };
    }
  }

  // Convert to array and sort by amount
  const incomeData = Object.values(incomeBreakdown).sort(
    (a, b) => b.amount - a.amount
  );

  // Get total income
  const totalIncome = incomeData.reduce((sum, item) => sum + item.amount, 0);

  return {
    totalIncome,
    incomeBreakdown: incomeData,
    transactionCount: incomeData.reduce((sum, item) => sum + item.count, 0),
  };
}

// Get expense report with real data including purchases
async function getExpenseReport(
  startDate?: string | null,
  endDate?: string | null,
  includePurchases: boolean = true
) {
  const whereClause: any = { type: 'EXPENSE' };

  if (startDate || endDate) {
    whereClause.transactionDate = {};
    if (startDate) whereClause.transactionDate.gte = new Date(startDate);
    if (endDate) whereClause.transactionDate.lte = new Date(endDate);
  }

  // Get manual expense transactions
  const expensesByType = await prisma.financialTransaction.findMany({
    where: whereClause,
    include: {
      expenseDetails: true,
    },
  });

  // Group by expense type
  const expenseBreakdown = expensesByType.reduce(
    (acc, transaction) => {
      const type = transaction.expenseDetails?.expenseType || 'Other';
      if (!acc[type]) {
        acc[type] = { type, amount: 0, count: 0 };
      }
      acc[type].amount += Number(transaction.amount);
      acc[type].count += 1;
      return acc;
    },
    {} as Record<string, { type: string; amount: number; count: number }>
  );

  // Add purchase data if requested
  if (includePurchases) {
    const purchaseWhereClause: any = {};
    if (startDate || endDate) {
      purchaseWhereClause.purchaseDate = {};
      if (startDate) purchaseWhereClause.purchaseDate.gte = new Date(startDate);
      if (endDate) purchaseWhereClause.purchaseDate.lte = new Date(endDate);
    }

    const stockAdditions = await prisma.stockAddition.findMany({
      where: purchaseWhereClause,
      include: {
        product: {
          select: { name: true },
        },
      },
    });

    const purchaseAmount = stockAdditions.reduce(
      (sum, addition) => sum + Number(addition.totalCost),
      0
    );
    const purchaseCount = stockAdditions.length;

    if (purchaseAmount > 0) {
      expenseBreakdown['INVENTORY_PURCHASES'] = {
        type: 'INVENTORY_PURCHASES',
        amount: purchaseAmount,
        count: purchaseCount,
      };
    }
  }

  // Convert to array and sort by amount
  const expenseData = Object.values(expenseBreakdown).sort(
    (a, b) => b.amount - a.amount
  );

  // Get total expenses
  const totalExpenses = expenseData.reduce((sum, item) => sum + item.amount, 0);

  return {
    totalExpenses,
    expenseBreakdown: expenseData,
    transactionCount: expenseData.reduce((sum, item) => sum + item.count, 0),
  };
}

// Get cash flow report with real data including sales and purchases
async function getCashFlowReport(
  startDate?: string | null,
  endDate?: string | null,
  includeSales: boolean = true,
  includePurchases: boolean = true
) {
  const whereClause: any = {};

  if (startDate || endDate) {
    whereClause.transactionDate = {};
    if (startDate) whereClause.transactionDate.gte = new Date(startDate);
    if (endDate) whereClause.transactionDate.lte = new Date(endDate);
  }

  // Get all manual transactions for the period
  const transactions = await prisma.financialTransaction.findMany({
    where: whereClause,
    include: {
      incomeDetails: true,
      expenseDetails: true,
    },
    orderBy: { transactionDate: 'asc' },
  });

  // Calculate cash flow components from manual transactions
  let operatingCashFlow = transactions
    .filter(
      t => t.type === 'INCOME' && t.incomeDetails?.incomeSource === 'SALES'
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);

  let investingCashFlow = transactions
    .filter(
      t =>
        t.type === 'EXPENSE' &&
        ['MAINTENANCE', 'INSURANCE', 'RENT'].includes(
          t.expenseDetails?.expenseType || ''
        )
    )
    .reduce((sum, t) => sum - Number(t.amount), 0);

  const financingCashFlow = transactions
    .filter(
      t =>
        (t.type === 'INCOME' &&
          t.incomeDetails?.incomeSource ===
            (INCOME_SOURCES.INVESTMENTS as any)) ||
        (t.type === 'EXPENSE' &&
          t.expenseDetails?.expenseType === (EXPENSE_TYPES.SALARIES as any))
    )
    .reduce(
      (sum, t) =>
        sum + (t.type === 'INCOME' ? Number(t.amount) : -Number(t.amount)),
      0
    );

  // Add sales data to operating cash flow if requested
  if (includeSales) {
    const salesWhereClause: any = {};
    if (startDate || endDate) {
      salesWhereClause.created_at = {};
      if (startDate) salesWhereClause.created_at.gte = new Date(startDate);
      if (endDate) salesWhereClause.created_at.lte = new Date(endDate);
    }
    salesWhereClause.payment_status = { in: SUCCESSFUL_PAYMENT_STATUSES };

    const salesTotal = await prisma.salesTransaction.aggregate({
      where: salesWhereClause,
      _sum: { total_amount: true },
    });

    const salesAmount = Number(salesTotal._sum.total_amount) || 0;
    operatingCashFlow += salesAmount;
  }

  // Add purchase data to investing cash flow if requested
  if (includePurchases) {
    const purchaseWhereClause: any = {};
    if (startDate || endDate) {
      purchaseWhereClause.purchaseDate = {};
      if (startDate) purchaseWhereClause.purchaseDate.gte = new Date(startDate);
      if (endDate) purchaseWhereClause.purchaseDate.lte = new Date(endDate);
    }

    const purchaseTotal = await prisma.stockAddition.aggregate({
      where: purchaseWhereClause,
      _sum: { totalCost: true },
    });

    const purchaseAmount = Number(purchaseTotal._sum.totalCost) || 0;
    investingCashFlow -= purchaseAmount; // Purchases are negative cash flow
  }

  const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;

  return {
    operatingCashFlow,
    investingCashFlow,
    financingCashFlow,
    netCashFlow,
    period: {
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  };
}

// Helper function to get recent transactions from all sources
async function getRecentTransactions(
  startDate?: string | null,
  endDate?: string | null,
  includeSales: boolean = true,
  includePurchases: boolean = true
) {
  const transactions: any[] = [];

  // Get recent manual financial transactions
  const manualWhereClause: any = {};
  if (startDate || endDate) {
    manualWhereClause.transactionDate = {};
    if (startDate) manualWhereClause.transactionDate.gte = new Date(startDate);
    if (endDate) manualWhereClause.transactionDate.lte = new Date(endDate);
  }

  const manualTransactions = await prisma.financialTransaction.findMany({
    where: manualWhereClause,
    include: {
      createdByUser: {
        select: { firstName: true, lastName: true, email: true },
      },
      incomeDetails: true,
      expenseDetails: true,
    },
    orderBy: { transactionDate: 'desc' },
    take: 10,
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
    const salesWhereClause: any = {};
    if (startDate || endDate) {
      salesWhereClause.created_at = {};
      if (startDate) salesWhereClause.created_at.gte = new Date(startDate);
      if (endDate) salesWhereClause.created_at.lte = new Date(endDate);
    }
    salesWhereClause.payment_status = { in: SUCCESSFUL_PAYMENT_STATUSES };

    const salesTransactions = await prisma.salesTransaction.findMany({
      where: salesWhereClause,
      include: {
        users: {
          select: { firstName: true, lastName: true, email: true },
        },
        customer: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 5,
    });

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
  }

  // Add recent purchases if requested
  if (includePurchases) {
    const purchaseWhereClause: any = {};
    if (startDate || endDate) {
      purchaseWhereClause.purchaseDate = {};
      if (startDate) purchaseWhereClause.purchaseDate.gte = new Date(startDate);
      if (endDate) purchaseWhereClause.purchaseDate.lte = new Date(endDate);
    }

    const stockAdditions = await prisma.stockAddition.findMany({
      where: purchaseWhereClause,
      include: {
        createdBy: {
          select: { firstName: true, lastName: true, email: true },
        },
        product: {
          select: { name: true },
        },
      },
      orderBy: { purchaseDate: 'desc' },
      take: 5,
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

  // Sort all transactions by date and return top 10
  return transactions
    .sort(
      (a, b) =>
        new Date(b.transactionDate).getTime() -
        new Date(a.transactionDate).getTime()
    )
    .slice(0, 10);
}
