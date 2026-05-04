import { format, startOfMonth, startOfWeek } from 'date-fns';
import { FINANCIAL_TYPES, INCOME_SOURCES } from '@/lib/constants/finance';
import type {
  FinanceAggregateResult,
  FinanceGroupBy,
  NormalizedFinanceTransaction,
} from './aggregation';

interface FinanceAggregateSummaryLike {
  totalTransactions: number;
  averageTransactionValue: number;
  topPaymentMethod: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
}

export interface CanonicalFinanceMetrics {
  posSalesRevenue: number;
  manualOperatingIncome: number;
  operatingRevenue: number;
  financingInflows: number;
  costOfGoodsSold: number;
  operatingExpenses: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  netOperatingCashFlow: number;
  netInvestingCashFlow: number;
  netFinancingCashFlow: number;
  totalCashFlow: number;
  totalTransactions: number;
  averageTransactionValue: number;
  topPaymentMethod: string;
}

export interface CanonicalFinanceTrend {
  date: string;
  revenue: number;
  financingInflows: number;
  expenses: number;
  costOfGoodsSold: number;
  operatingExpenses: number;
  grossProfit: number;
  netProfit: number;
  netCashFlow: number;
  transactions: number;
}

interface CanonicalTrendAccumulator {
  revenue: number;
  financingInflows: number;
  costOfGoodsSold: number;
  operatingExpenses: number;
  transactions: number;
}

function isOperatingRevenueTransaction(
  transaction: NormalizedFinanceTransaction
): boolean {
  return (
    transaction.type === FINANCIAL_TYPES.INCOME &&
    (transaction.source === 'POS_SALE' ||
      (transaction.source === 'MANUAL' &&
        transaction.category !== INCOME_SOURCES.INVESTMENTS))
  );
}

function isFinancingInflowTransaction(
  transaction: NormalizedFinanceTransaction
): boolean {
  return (
    transaction.type === FINANCIAL_TYPES.INCOME &&
    transaction.source === 'MANUAL' &&
    transaction.category === INCOME_SOURCES.INVESTMENTS
  );
}

function isCostOfGoodsTransaction(
  transaction: NormalizedFinanceTransaction
): boolean {
  return (
    transaction.type === FINANCIAL_TYPES.EXPENSE &&
    transaction.source === 'STOCK_PURCHASE'
  );
}

function isOperatingExpenseTransaction(
  transaction: NormalizedFinanceTransaction
): boolean {
  return (
    transaction.type === FINANCIAL_TYPES.EXPENSE &&
    transaction.source === 'MANUAL'
  );
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

function buildSummaryFallback(
  summary: FinanceAggregateSummaryLike
): CanonicalFinanceMetrics {
  return {
    posSalesRevenue: 0,
    manualOperatingIncome: summary.totalIncome,
    operatingRevenue: summary.totalIncome,
    financingInflows: 0,
    costOfGoodsSold: 0,
    operatingExpenses: summary.totalExpenses,
    totalExpenses: summary.totalExpenses,
    grossProfit: summary.totalIncome,
    netProfit: summary.netProfit,
    netOperatingCashFlow: summary.totalIncome - summary.totalExpenses,
    netInvestingCashFlow: 0,
    netFinancingCashFlow: 0,
    totalCashFlow: summary.netProfit,
    totalTransactions: summary.totalTransactions,
    averageTransactionValue: summary.averageTransactionValue,
    topPaymentMethod: summary.topPaymentMethod,
  };
}

export function deriveCanonicalFinanceMetrics(
  transactions: NormalizedFinanceTransaction[] | undefined,
  summary?: FinanceAggregateSummaryLike
): CanonicalFinanceMetrics {
  const normalizedTransactions = transactions ?? [];

  if (normalizedTransactions.length === 0) {
    if (summary) {
      return buildSummaryFallback(summary);
    }

    return {
      posSalesRevenue: 0,
      manualOperatingIncome: 0,
      operatingRevenue: 0,
      financingInflows: 0,
      costOfGoodsSold: 0,
      operatingExpenses: 0,
      totalExpenses: 0,
      grossProfit: 0,
      netProfit: 0,
      netOperatingCashFlow: 0,
      netInvestingCashFlow: 0,
      netFinancingCashFlow: 0,
      totalCashFlow: 0,
      totalTransactions: 0,
      averageTransactionValue: 0,
      topPaymentMethod: '',
    };
  }

  let posSalesRevenue = 0;
  let manualOperatingIncome = 0;
  let financingInflows = 0;
  let costOfGoodsSold = 0;
  let operatingExpenses = 0;

  normalizedTransactions.forEach(transaction => {
    if (transaction.source === 'POS_SALE') {
      posSalesRevenue += transaction.amount;
      return;
    }

    if (isFinancingInflowTransaction(transaction)) {
      financingInflows += transaction.amount;
      return;
    }

    if (isOperatingRevenueTransaction(transaction)) {
      manualOperatingIncome += transaction.amount;
      return;
    }

    if (isCostOfGoodsTransaction(transaction)) {
      costOfGoodsSold += transaction.amount;
      return;
    }

    if (isOperatingExpenseTransaction(transaction)) {
      operatingExpenses += transaction.amount;
    }
  });

  const operatingRevenue = posSalesRevenue + manualOperatingIncome;
  const totalExpenses = costOfGoodsSold + operatingExpenses;
  const grossProfit = operatingRevenue - costOfGoodsSold;
  const netProfit = grossProfit - operatingExpenses;
  const netOperatingCashFlow = operatingRevenue - operatingExpenses;
  const netInvestingCashFlow = -costOfGoodsSold;
  const netFinancingCashFlow = financingInflows;
  const totalCashFlow =
    netOperatingCashFlow + netInvestingCashFlow + netFinancingCashFlow;

  return {
    posSalesRevenue,
    manualOperatingIncome,
    operatingRevenue,
    financingInflows,
    costOfGoodsSold,
    operatingExpenses,
    totalExpenses,
    grossProfit,
    netProfit,
    netOperatingCashFlow,
    netInvestingCashFlow,
    netFinancingCashFlow,
    totalCashFlow,
    totalTransactions:
      summary?.totalTransactions ?? normalizedTransactions.length,
    averageTransactionValue: summary?.averageTransactionValue ?? 0,
    topPaymentMethod: summary?.topPaymentMethod ?? '',
  };
}

export function buildCanonicalFinanceTrends(
  transactions: NormalizedFinanceTransaction[] | undefined,
  groupBy: FinanceGroupBy = 'day'
): CanonicalFinanceTrend[] {
  const trendMap = new Map<string, CanonicalTrendAccumulator>();

  (transactions ?? []).forEach(transaction => {
    const key = getPeriodKey(transaction.date, groupBy);
    const current = trendMap.get(key) || {
      revenue: 0,
      financingInflows: 0,
      costOfGoodsSold: 0,
      operatingExpenses: 0,
      transactions: 0,
    };

    if (isOperatingRevenueTransaction(transaction)) {
      current.revenue += transaction.amount;
    } else if (isFinancingInflowTransaction(transaction)) {
      current.financingInflows += transaction.amount;
    } else if (isCostOfGoodsTransaction(transaction)) {
      current.costOfGoodsSold += transaction.amount;
    } else if (isOperatingExpenseTransaction(transaction)) {
      current.operatingExpenses += transaction.amount;
    }

    current.transactions += 1;
    trendMap.set(key, current);
  });

  return Array.from(trendMap.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([date, values]) => {
      const expenses = values.costOfGoodsSold + values.operatingExpenses;
      const grossProfit = values.revenue - values.costOfGoodsSold;
      const netProfit = grossProfit - values.operatingExpenses;
      const netCashFlow =
        values.revenue -
        values.operatingExpenses -
        values.costOfGoodsSold +
        values.financingInflows;

      return {
        date,
        revenue: values.revenue,
        financingInflows: values.financingInflows,
        expenses,
        costOfGoodsSold: values.costOfGoodsSold,
        operatingExpenses: values.operatingExpenses,
        grossProfit,
        netProfit,
        netCashFlow,
        transactions: values.transactions,
      };
    });
}

export function buildOperatingRevenueBySource(
  transactions: NormalizedFinanceTransaction[] | undefined
): Array<{
  source: string;
  revenue: number;
  transactionCount: number;
}> {
  const revenueBySource = new Map<
    string,
    { revenue: number; transactionCount: number }
  >();

  (transactions ?? [])
    .filter(isOperatingRevenueTransaction)
    .forEach(transaction => {
      const key =
        transaction.source === 'POS_SALE'
          ? 'POS_SALES'
          : transaction.category;
      const current = revenueBySource.get(key) || {
        revenue: 0,
        transactionCount: 0,
      };

      revenueBySource.set(key, {
        revenue: current.revenue + transaction.amount,
        transactionCount: current.transactionCount + 1,
      });
    });

  return Array.from(revenueBySource.entries())
    .map(([source, values]) => ({
      source,
      revenue: values.revenue,
      transactionCount: values.transactionCount,
    }))
    .sort((left, right) => right.revenue - left.revenue);
}

export function summarizeCanonicalFinanceAggregate(
  aggregate: Pick<FinanceAggregateResult, 'transactions' | 'summary'>
): CanonicalFinanceMetrics {
  return deriveCanonicalFinanceMetrics(aggregate.transactions, aggregate.summary);
}
