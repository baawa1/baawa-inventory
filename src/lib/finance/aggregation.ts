import { format, startOfMonth, startOfWeek } from 'date-fns';
import { prisma } from '@/lib/db';
import { SUCCESSFUL_PAYMENT_STATUSES } from '@/lib/constants';
import {
  EXPENSE_TYPE_LABELS,
  FINANCIAL_TYPES,
  INCOME_SOURCE_LABELS,
} from '@/lib/constants/finance';
import {
  isManualExpenseTypeBlocked,
  isManualIncomeSourceBlocked,
  REPORTABLE_MANUAL_FINANCE_STATUSES,
} from './manual-transaction-policy';
import {
  buildFinanceRange,
  getPreviousFinanceRange,
  type FinanceRange,
} from './date-range';
import { getFinanceUserDisplayName } from './transaction-access';

export type FinanceTransactionType = 'INCOME' | 'EXPENSE';
export type FinanceGroupBy = 'day' | 'week' | 'month';
export type FinanceSource = 'MANUAL' | 'POS_SALE' | 'STOCK_PURCHASE';

export interface FinanceAggregationFilters {
  startDate?: Date;
  endDate?: Date;
  type?: 'all' | 'income' | 'expense';
  paymentMethod?: string;
}

export interface NormalizedFinanceTransaction {
  id: string;
  source: FinanceSource;
  sourceId: number;
  transactionNumber: string;
  type: FinanceTransactionType;
  amount: number;
  date: Date;
  paymentMethod: string | null;
  description: string;
  category: string;
  categoryLabel: string;
  status: string;
  createdByName?: string;
  vendorName?: string | null;
  payerName?: string | null;
  customerName?: string | null;
  reference?: string | null;
  flaggedOverlap: boolean;
}

export interface FinanceSummaryTotals {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  totalTransactions: number;
  averageTransactionValue: number;
  topPaymentMethod: string;
}

export interface FinanceAggregateResult {
  transactions: NormalizedFinanceTransaction[];
  summary: FinanceSummaryTotals;
  paymentMethodDistribution: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  dailyTrends: Array<{
    date: string;
    revenue: number;
    expenses: number;
    netProfit: number;
    transactions: number;
  }>;
  expenseBreakdown: Record<string, number>;
  topVendors: Array<{
    vendor: string;
    amount: number;
    category: string;
  }>;
}

export interface FinanceOverlapEntry {
  id: number;
  transactionNumber: string;
  type: FinanceTransactionType;
  amount: number;
  transactionDate: Date;
  description: string | null;
  status: string;
  category: string;
  categoryLabel: string;
  createdBy: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

function toAmount(value: unknown): number {
  return Number(value || 0);
}

export function normalizeFinancePaymentMethod(
  method?: string | null
): string | null {
  if (!method) {
    return null;
  }

  switch (method.toLowerCase()) {
    case 'cash':
      return 'CASH';
    case 'bank':
    case 'bank_transfer':
      return 'BANK_TRANSFER';
    case 'pos':
    case 'pos_machine':
      return 'POS_MACHINE';
    case 'credit_card':
      return 'CREDIT_CARD';
    case 'mobile':
    case 'mobile_money':
      return 'MOBILE_MONEY';
    default:
      return method.toUpperCase();
  }
}

function displayPaymentMethod(method?: string | null): string {
  if (!method) {
    return 'Unspecified';
  }

  return method
    .split('_')
    .map(part => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

function matchesType(
  requestedType: FinanceAggregationFilters['type'],
  transactionType: FinanceTransactionType
): boolean {
  if (!requestedType || requestedType === 'all') {
    return true;
  }

  return requestedType.toUpperCase() === transactionType;
}

function matchesPaymentMethod(
  requestedMethod: string | undefined,
  paymentMethod: string | null
): boolean {
  if (!requestedMethod) {
    return true;
  }

  return normalizeFinancePaymentMethod(requestedMethod) === paymentMethod;
}

function getPeriodKey(date: Date, groupBy: FinanceGroupBy): string {
  if (groupBy === 'month') {
    return format(startOfMonth(date), 'yyyy-MM-dd');
  }

  if (groupBy === 'week') {
    return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  }

  return format(date, 'yyyy-MM-dd');
}

export async function getNormalizedFinanceTransactions(
  filters: FinanceAggregationFilters,
  options?: {
    includeFlaggedOverlaps?: boolean;
    limit?: number;
  }
): Promise<NormalizedFinanceTransaction[]> {
  const { includeFlaggedOverlaps = false, limit } = options ?? {};
  const { startDate, endDate, type, paymentMethod } = filters;

  const manualWhere: Record<string, unknown> = {
    status: {
      in: [...REPORTABLE_MANUAL_FINANCE_STATUSES],
    },
  };

  if (startDate || endDate) {
    manualWhere.transactionDate = {};
    if (startDate) {
      (manualWhere.transactionDate as Record<string, Date>).gte = startDate;
    }
    if (endDate) {
      (manualWhere.transactionDate as Record<string, Date>).lte = endDate;
    }
  }

  const salesWhere: Record<string, unknown> = {
    payment_status: {
      in: SUCCESSFUL_PAYMENT_STATUSES,
    },
  };

  if (startDate || endDate) {
    salesWhere.created_at = {};
    if (startDate) {
      (salesWhere.created_at as Record<string, Date>).gte = startDate;
    }
    if (endDate) {
      (salesWhere.created_at as Record<string, Date>).lte = endDate;
    }
  }

  const stockWhere: Record<string, unknown> = {};
  if (startDate || endDate) {
    stockWhere.purchaseDate = {};
    if (startDate) {
      (stockWhere.purchaseDate as Record<string, Date>).gte = startDate;
    }
    if (endDate) {
      (stockWhere.purchaseDate as Record<string, Date>).lte = endDate;
    }
  }

  const [manualTransactions, salesTransactions, stockAdditions] =
    await Promise.all([
      prisma.financialTransaction.findMany({
        where: manualWhere as any,
        select: {
          id: true,
          transactionNumber: true,
          type: true,
          amount: true,
          description: true,
          transactionDate: true,
          paymentMethod: true,
          status: true,
          createdByUser: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          incomeDetails: {
            select: {
              incomeSource: true,
              payerName: true,
            },
          },
          expenseDetails: {
            select: {
              expenseType: true,
              vendorName: true,
            },
          },
        },
        orderBy: {
          transactionDate: 'desc',
        },
        take: limit,
      }),
      type === 'expense'
        ? Promise.resolve([])
        : prisma.salesTransaction.findMany({
            where: salesWhere as any,
            select: {
              id: true,
              transaction_number: true,
              total_amount: true,
              created_at: true,
              payment_method: true,
              customer: {
                select: {
                  name: true,
                  email: true,
                },
              },
              users: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: {
              created_at: 'desc',
            },
            take: limit,
          }),
      type === 'income' || paymentMethod
        ? Promise.resolve([])
        : prisma.stockAddition.findMany({
            where: stockWhere as any,
            select: {
              id: true,
              totalCost: true,
              purchaseDate: true,
              referenceNo: true,
              createdBy: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              product: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: {
              purchaseDate: 'desc',
            },
            take: limit,
          }),
    ]);

  const normalizedManual = manualTransactions
    .map(transaction => {
      const category =
        transaction.type === FINANCIAL_TYPES.INCOME
          ? transaction.incomeDetails?.incomeSource || 'OTHER'
          : transaction.expenseDetails?.expenseType || 'OTHER';

      const flaggedOverlap =
        transaction.type === FINANCIAL_TYPES.INCOME
          ? isManualIncomeSourceBlocked(transaction.incomeDetails?.incomeSource)
          : isManualExpenseTypeBlocked(transaction.expenseDetails?.expenseType);

      const payment = normalizeFinancePaymentMethod(transaction.paymentMethod);
      const createdByName = getFinanceUserDisplayName(
        transaction.createdByUser
      );

      return {
        id: `manual-${transaction.id}`,
        source: 'MANUAL' as const,
        sourceId: transaction.id,
        transactionNumber: transaction.transactionNumber,
        type: transaction.type as FinanceTransactionType,
        amount: toAmount(transaction.amount),
        date: transaction.transactionDate,
        paymentMethod: payment,
        description: transaction.description || 'Manual finance transaction',
        category,
        categoryLabel:
          transaction.type === FINANCIAL_TYPES.INCOME
            ? INCOME_SOURCE_LABELS[category as keyof typeof INCOME_SOURCE_LABELS] ||
              category
            : EXPENSE_TYPE_LABELS[category as keyof typeof EXPENSE_TYPE_LABELS] ||
              category,
        status: transaction.status,
        createdByName,
        vendorName: transaction.expenseDetails?.vendorName,
        payerName: transaction.incomeDetails?.payerName,
        flaggedOverlap,
      };
    })
    .filter(transaction => matchesType(type, transaction.type))
    .filter(transaction => matchesPaymentMethod(paymentMethod, transaction.paymentMethod))
    .filter(transaction => includeFlaggedOverlaps || !transaction.flaggedOverlap);

  const normalizedSales = salesTransactions
    .map(transaction => {
      const payment = normalizeFinancePaymentMethod(transaction.payment_method);
      const customerName =
        transaction.customer?.name ||
        transaction.customer?.email ||
        'Walk-in Customer';

      return {
        id: `sale-${transaction.id}`,
        source: 'POS_SALE' as const,
        sourceId: transaction.id,
        transactionNumber: transaction.transaction_number,
        type: FINANCIAL_TYPES.INCOME,
        amount: toAmount(transaction.total_amount),
        date: transaction.created_at || new Date(),
        paymentMethod: payment,
        description: `POS sale - ${customerName}`,
        category: 'POS_SALES',
        categoryLabel: 'POS Sales',
        status: 'COMPLETED',
        createdByName: getFinanceUserDisplayName(transaction.users),
        customerName,
        flaggedOverlap: false,
      };
    })
    .filter(transaction => matchesPaymentMethod(paymentMethod, transaction.paymentMethod));

  const normalizedPurchases = stockAdditions.map(transaction => ({
    id: `purchase-${transaction.id}`,
    source: 'STOCK_PURCHASE' as const,
    sourceId: transaction.id,
    transactionNumber: transaction.referenceNo || `PUR-${transaction.id}`,
    type: FINANCIAL_TYPES.EXPENSE,
    amount: toAmount(transaction.totalCost),
    date: transaction.purchaseDate || new Date(),
    paymentMethod: null,
    description: `Inventory purchase - ${transaction.product?.name || 'Stock item'}`,
    category: 'INVENTORY_PURCHASES',
    categoryLabel: 'Inventory Purchases',
    status: 'COMPLETED',
    createdByName: getFinanceUserDisplayName(transaction.createdBy),
    reference: transaction.referenceNo,
    flaggedOverlap: false,
  }));

  return [...normalizedManual, ...normalizedSales, ...normalizedPurchases]
    .sort((left, right) => right.date.getTime() - left.date.getTime())
    .slice(0, limit ?? Number.MAX_SAFE_INTEGER);
}

export function summarizeFinanceTransactions(
  transactions: NormalizedFinanceTransaction[]
): FinanceSummaryTotals {
  let totalIncome = 0;
  let totalExpenses = 0;

  const paymentMethodMap = new Map<string, { count: number; amount: number }>();

  transactions.forEach(transaction => {
    if (transaction.type === FINANCIAL_TYPES.INCOME) {
      totalIncome += transaction.amount;
    } else {
      totalExpenses += transaction.amount;
    }

    if (transaction.paymentMethod) {
      const current = paymentMethodMap.get(transaction.paymentMethod) || {
        count: 0,
        amount: 0,
      };
      paymentMethodMap.set(transaction.paymentMethod, {
        count: current.count + 1,
        amount: current.amount + transaction.amount,
      });
    }
  });

  const topPaymentMethod = Array.from(paymentMethodMap.entries()).sort(
    (left, right) => right[1].count - left[1].count
  )[0]?.[0];

  const transactionVolume = totalIncome + totalExpenses;

  return {
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    totalTransactions: transactions.length,
    averageTransactionValue:
      transactions.length > 0 ? transactionVolume / transactions.length : 0,
    topPaymentMethod: displayPaymentMethod(topPaymentMethod),
  };
}

export function buildPaymentMethodDistribution(
  transactions: NormalizedFinanceTransaction[]
): Array<{ method: string; count: number; amount: number }> {
  const paymentMethodMap = new Map<string, { count: number; amount: number }>();

  transactions.forEach(transaction => {
    if (!transaction.paymentMethod) {
      return;
    }

    const current = paymentMethodMap.get(transaction.paymentMethod) || {
      count: 0,
      amount: 0,
    };

    paymentMethodMap.set(transaction.paymentMethod, {
      count: current.count + 1,
      amount: current.amount + transaction.amount,
    });
  });

  return Array.from(paymentMethodMap.entries()).map(([method, values]) => ({
    method,
    count: values.count,
    amount: values.amount,
  }));
}

export function buildFinanceTrends(
  transactions: NormalizedFinanceTransaction[],
  groupBy: FinanceGroupBy = 'day'
): Array<{
  date: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  transactions: number;
}> {
  const trendMap = new Map<
    string,
    { revenue: number; expenses: number; transactions: number }
  >();

  transactions.forEach(transaction => {
    const key = getPeriodKey(transaction.date, groupBy);
    const current = trendMap.get(key) || {
      revenue: 0,
      expenses: 0,
      transactions: 0,
    };

    if (transaction.type === FINANCIAL_TYPES.INCOME) {
      current.revenue += transaction.amount;
    } else {
      current.expenses += transaction.amount;
    }

    current.transactions += 1;
    trendMap.set(key, current);
  });

  return Array.from(trendMap.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([date, values]) => ({
      date,
      revenue: values.revenue,
      expenses: values.expenses,
      netProfit: values.revenue - values.expenses,
      transactions: values.transactions,
    }));
}

export function buildExpenseBreakdown(
  transactions: NormalizedFinanceTransaction[]
): Record<string, number> {
  const breakdown = new Map<string, number>();

  transactions
    .filter(transaction => transaction.type === FINANCIAL_TYPES.EXPENSE)
    .forEach(transaction => {
      breakdown.set(
        transaction.category,
        (breakdown.get(transaction.category) || 0) + transaction.amount
      );
    });

  return Object.fromEntries(breakdown.entries());
}

export function buildTopExpenseVendors(
  transactions: NormalizedFinanceTransaction[],
  limit = 10
): Array<{ vendor: string; amount: number; category: string }> {
  const vendorMap = new Map<string, { amount: number; category: string }>();

  transactions
    .filter(transaction => transaction.type === FINANCIAL_TYPES.EXPENSE)
    .filter(transaction => Boolean(transaction.vendorName))
    .forEach(transaction => {
      const vendorName = transaction.vendorName || 'Unknown Vendor';
      const current = vendorMap.get(vendorName) || {
        amount: 0,
        category: transaction.category,
      };

      vendorMap.set(vendorName, {
        amount: current.amount + transaction.amount,
        category: current.category,
      });
    });

  return Array.from(vendorMap.entries())
    .map(([vendor, data]) => ({
      vendor,
      amount: data.amount,
      category: data.category,
    }))
    .sort((left, right) => right.amount - left.amount)
    .slice(0, limit);
}

export async function getFinanceAggregate(
  filters: FinanceAggregationFilters,
  options?: {
    groupBy?: FinanceGroupBy;
    includeFlaggedOverlaps?: boolean;
    limit?: number;
  }
): Promise<FinanceAggregateResult> {
  const transactions = await getNormalizedFinanceTransactions(filters, {
    includeFlaggedOverlaps: options?.includeFlaggedOverlaps,
    limit: options?.limit,
  });

  return {
    transactions,
    summary: summarizeFinanceTransactions(transactions),
    paymentMethodDistribution: buildPaymentMethodDistribution(transactions),
    dailyTrends: buildFinanceTrends(transactions, options?.groupBy),
    expenseBreakdown: buildExpenseBreakdown(transactions),
    topVendors: buildTopExpenseVendors(transactions),
  };
}

export async function getRecentFinanceTransactions(limit = 10) {
  return getNormalizedFinanceTransactions({}, { limit });
}

export { buildFinanceRange, getPreviousFinanceRange };
export type { FinanceRange };

export async function getManualFinanceOverlapEntries(
  range?: Partial<FinanceRange>
): Promise<FinanceOverlapEntry[]> {
  const where: Record<string, unknown> = {};

  if (range?.startDate || range?.endDate) {
    where.transactionDate = {};
    if (range.startDate) {
      (where.transactionDate as Record<string, Date>).gte = range.startDate;
    }
    if (range.endDate) {
      (where.transactionDate as Record<string, Date>).lte = range.endDate;
    }
  }

  const transactions = await prisma.financialTransaction.findMany({
    where: where as any,
    select: {
      id: true,
      transactionNumber: true,
      type: true,
      amount: true,
      description: true,
      transactionDate: true,
      status: true,
      createdByUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      incomeDetails: {
        select: {
          incomeSource: true,
        },
      },
      expenseDetails: {
        select: {
          expenseType: true,
        },
      },
    },
    orderBy: {
      transactionDate: 'desc',
    },
  });

  return transactions
    .filter(transaction => {
      if (transaction.type === FINANCIAL_TYPES.INCOME) {
        return isManualIncomeSourceBlocked(transaction.incomeDetails?.incomeSource);
      }

      return isManualExpenseTypeBlocked(transaction.expenseDetails?.expenseType);
    })
    .map(transaction => {
      const category =
        transaction.type === FINANCIAL_TYPES.INCOME
          ? transaction.incomeDetails?.incomeSource || 'OTHER'
          : transaction.expenseDetails?.expenseType || 'OTHER';

      return {
        id: transaction.id,
        transactionNumber: transaction.transactionNumber,
        type: transaction.type as FinanceTransactionType,
        amount: toAmount(transaction.amount),
        transactionDate: transaction.transactionDate,
        description: transaction.description,
        status: transaction.status,
        category,
        categoryLabel:
          transaction.type === FINANCIAL_TYPES.INCOME
            ? INCOME_SOURCE_LABELS[category as keyof typeof INCOME_SOURCE_LABELS] ||
              category
            : EXPENSE_TYPE_LABELS[category as keyof typeof EXPENSE_TYPE_LABELS] ||
              category,
        createdBy: transaction.createdByUser,
      };
    });
}
