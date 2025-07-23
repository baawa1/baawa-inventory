import { prisma } from "@/lib/db";

/**
 * Generate a unique transaction number
 * Format: FIN-YYYYMMDD-XXXX
 */
export async function generateTransactionNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const prefix = `FIN-${year}${month}${day}`;

  const lastTransaction = await prisma.financialTransaction.findFirst({
    where: {
      transactionNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      transactionNumber: "desc",
    },
  });

  let sequence = 1;
  if (lastTransaction) {
    const lastSequence = parseInt(lastTransaction.transactionNumber.slice(-4));
    sequence = lastSequence + 1;
  }

  return `${prefix}-${String(sequence).padStart(4, "0")}`;
}

/**
 * Calculate net amount after tax deduction
 */
export function calculateNetAmount(
  amount: number,
  taxAmount: number = 0
): number {
  return amount - taxAmount;
}

/**
 * Calculate tax amount based on rate
 */
export function calculateTaxAmount(amount: number, taxRate: number): number {
  return (amount * taxRate) / 100;
}

/**
 * Format currency with Nigerian Naira
 */
export function formatCurrency(
  amount: number,
  currency: string = "NGN"
): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

/**
 * Get financial summary from transactions array
 */
export function getFinancialSummary(transactions: any[]) {
  const summary = {
    totalIncome: 0,
    totalExpense: 0,
    netAmount: 0,
    transactionCount: transactions.length,
  };

  transactions.forEach((transaction) => {
    if (transaction.type === "INCOME") {
      summary.totalIncome += Number(transaction.amount);
    } else {
      summary.totalExpense += Number(transaction.amount);
    }
  });

  summary.netAmount = summary.totalIncome - summary.totalExpense;
  return summary;
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Format percentage with sign
 */
export function formatPercentage(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Get date range for period type
 */
export function getDateRangeForPeriod(
  periodType: "MONTHLY" | "QUARTERLY" | "YEARLY",
  referenceDate: Date = new Date()
): { startDate: Date; endDate: Date } {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  switch (periodType) {
    case "MONTHLY":
      return {
        startDate: new Date(year, month, 1),
        endDate: new Date(year, month + 1, 0),
      };
    case "QUARTERLY":
      const quarter = Math.floor(month / 3);
      const quarterStartMonth = quarter * 3;
      return {
        startDate: new Date(year, quarterStartMonth, 1),
        endDate: new Date(year, quarterStartMonth + 3, 0),
      };
    case "YEARLY":
      return {
        startDate: new Date(year, 0, 1),
        endDate: new Date(year, 11, 31),
      };
    default:
      throw new Error("Invalid period type");
  }
}

/**
 * Validate transaction amount
 */
export function validateTransactionAmount(amount: number): boolean {
  return amount > 0 && amount <= 999999999.99; // Max amount based on Decimal(15,2)
}

/**
 * Sanitize file upload URL
 */
export function sanitizeFileUrl(url: string | null | undefined): string | null {
  if (!url || url.trim() === "") return null;
  
  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

/**
 * Generate financial report data structure
 */
export function generateReportDataStructure(
  transactions: any[],
  reportType: string,
  periodStart: Date,
  periodEnd: Date
) {
  const summary = getFinancialSummary(transactions);
  
  return {
    reportType,
    period: {
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
    },
    summary,
    transactions: transactions.map(t => ({
      id: t.id,
      date: t.transactionDate,
      type: t.type,
      amount: Number(t.amount),
      description: t.description,
      category: t.category?.name,
      status: t.status,
    })),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Calculate budget utilization percentage
 */
export function calculateBudgetUtilization(
  budgetAmount: number,
  actualAmount: number
): number {
  if (budgetAmount === 0) return 0;
  return (actualAmount / budgetAmount) * 100;
}

/**
 * Get budget status based on utilization
 */
export function getBudgetStatus(utilizationPercentage: number): {
  status: "on-track" | "warning" | "over-budget";
  color: string;
} {
  if (utilizationPercentage <= 75) {
    return { status: "on-track", color: "green" };
  } else if (utilizationPercentage <= 100) {
    return { status: "warning", color: "yellow" };
  } else {
    return { status: "over-budget", color: "red" };
  }
}