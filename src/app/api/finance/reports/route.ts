import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { createApiResponse } from "@/lib/api-response";
import { prisma } from "@/lib/db";

// GET /api/finance/reports - Get financial reports with real data
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "FINANCIAL_SUMMARY";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let reportData;

    switch (reportType) {
      case "FINANCIAL_SUMMARY":
        reportData = await getFinancialSummary(startDate, endDate);
        break;
      case "INCOME_REPORT":
        reportData = await getIncomeReport(startDate, endDate);
        break;
      case "EXPENSE_REPORT":
        reportData = await getExpenseReport(startDate, endDate);
        break;
      case "CASH_FLOW":
        reportData = await getCashFlowReport(startDate, endDate);
        break;
      default:
        return createApiResponse.badRequest("Invalid report type");
    }

    return createApiResponse.success(reportData);
  } catch (error) {
    console.error("Error generating finance report:", error);
    return createApiResponse.internalError("Failed to generate report");
  }
});

// Get financial summary with real calculations
async function getFinancialSummary(
  startDate?: string | null,
  endDate?: string | null
) {
  const whereClause: any = {};

  if (startDate || endDate) {
    whereClause.transactionDate = {};
    if (startDate) whereClause.transactionDate.gte = new Date(startDate);
    if (endDate) whereClause.transactionDate.lte = new Date(endDate);
  }

  // Get income and expense totals
  const [incomeTotal, expenseTotal, transactionCount] = await Promise.all([
    prisma.financialTransaction.aggregate({
      where: { ...whereClause, type: "INCOME" },
      _sum: { amount: true },
    }),
    prisma.financialTransaction.aggregate({
      where: { ...whereClause, type: "EXPENSE" },
      _sum: { amount: true },
    }),
    prisma.financialTransaction.count({ where: whereClause }),
  ]);

  const totalIncome = incomeTotal._sum.amount || 0;
  const totalExpenses = expenseTotal._sum.amount || 0;
  const netIncome = totalIncome - totalExpenses;

  // Get recent transactions
  const recentTransactions = await prisma.financialTransaction.findMany({
    where: whereClause,
    include: {
      createdByUser: {
        select: { firstName: true, lastName: true, email: true },
      },
      incomeDetails: true,
      expenseDetails: true,
    },
    orderBy: { transactionDate: "desc" },
    take: 10,
  });

  return {
    totalIncome,
    totalExpenses,
    netIncome,
    transactionCount,
    recentTransactions: recentTransactions.map((t) => ({
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
    })),
  };
}

// Get income report with real data
async function getIncomeReport(
  startDate?: string | null,
  endDate?: string | null
) {
  const whereClause: any = { type: "INCOME" };

  if (startDate || endDate) {
    whereClause.transactionDate = {};
    if (startDate) whereClause.transactionDate.gte = new Date(startDate);
    if (endDate) whereClause.transactionDate.lte = new Date(endDate);
  }

  // Get income by source
  const incomeBySource = await prisma.financialTransaction.findMany({
    where: whereClause,
    include: {
      incomeDetails: true,
    },
  });

  // Group by income source
  const incomeBreakdown = incomeBySource.reduce(
    (acc, transaction) => {
      const source = transaction.incomeDetails?.incomeSource || "Other";
      if (!acc[source]) {
        acc[source] = { source, amount: 0, count: 0 };
      }
      acc[source].amount += Number(transaction.amount);
      acc[source].count += 1;
      return acc;
    },
    {} as Record<string, { source: string; amount: number; count: number }>
  );

  // Convert to array and sort by amount
  const incomeData = Object.values(incomeBreakdown).sort(
    (a, b) => b.amount - a.amount
  );

  // Get total income
  const totalIncome = incomeData.reduce((sum, item) => sum + item.amount, 0);

  return {
    totalIncome,
    incomeBreakdown: incomeData,
    transactionCount: incomeBySource.length,
  };
}

// Get expense report with real data
async function getExpenseReport(
  startDate?: string | null,
  endDate?: string | null
) {
  const whereClause: any = { type: "EXPENSE" };

  if (startDate || endDate) {
    whereClause.transactionDate = {};
    if (startDate) whereClause.transactionDate.gte = new Date(startDate);
    if (endDate) whereClause.transactionDate.lte = new Date(endDate);
  }

  // Get expenses by type
  const expensesByType = await prisma.financialTransaction.findMany({
    where: whereClause,
    include: {
      expenseDetails: true,
    },
  });

  // Group by expense type
  const expenseBreakdown = expensesByType.reduce(
    (acc, transaction) => {
      const type = transaction.expenseDetails?.expenseType || "Other";
      if (!acc[type]) {
        acc[type] = { type, amount: 0, count: 0 };
      }
      acc[type].amount += Number(transaction.amount);
      acc[type].count += 1;
      return acc;
    },
    {} as Record<string, { type: string; amount: number; count: number }>
  );

  // Convert to array and sort by amount
  const expenseData = Object.values(expenseBreakdown).sort(
    (a, b) => b.amount - a.amount
  );

  // Get total expenses
  const totalExpenses = expenseData.reduce((sum, item) => sum + item.amount, 0);

  return {
    totalExpenses,
    expenseBreakdown: expenseData,
    transactionCount: expensesByType.length,
  };
}

// Get cash flow report with real data
async function getCashFlowReport(
  startDate?: string | null,
  endDate?: string | null
) {
  const whereClause: any = {};

  if (startDate || endDate) {
    whereClause.transactionDate = {};
    if (startDate) whereClause.transactionDate.gte = new Date(startDate);
    if (endDate) whereClause.transactionDate.lte = new Date(endDate);
  }

  // Get all transactions for the period
  const transactions = await prisma.financialTransaction.findMany({
    where: whereClause,
    include: {
      incomeDetails: true,
      expenseDetails: true,
    },
    orderBy: { transactionDate: "asc" },
  });

  // Calculate cash flow components
  const operatingCashFlow = transactions
    .filter(
      (t) => t.type === "INCOME" && t.incomeDetails?.incomeSource === "SALES"
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const investingCashFlow = transactions
    .filter(
      (t) =>
        t.type === "EXPENSE" &&
        ["MAINTENANCE", "INSURANCE", "RENT"].includes(
          t.expenseDetails?.expenseType || ""
        )
    )
    .reduce((sum, t) => sum - Number(t.amount), 0);

  const financingCashFlow = transactions
    .filter(
      (t) =>
        (t.type === "INCOME" && t.incomeDetails?.incomeSource === "LOAN") ||
        (t.type === "EXPENSE" && t.expenseDetails?.expenseType === "SALARIES")
    )
    .reduce(
      (sum, t) =>
        sum + (t.type === "INCOME" ? Number(t.amount) : -Number(t.amount)),
      0
    );

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
