import { format, startOfMonth, startOfWeek } from 'date-fns';
import type {
  FinanceAggregateResult,
  FinanceGroupBy,
  NormalizedFinanceTransaction,
} from './ledger';

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
  cashIn: number;
  cashOut: number;
  transactions: number;
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
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
    posSalesRevenue: summary.totalIncome,
    manualOperatingIncome: 0,
    operatingRevenue: summary.totalIncome,
    financingInflows: 0,
    costOfGoodsSold: summary.totalExpenses,
    operatingExpenses: 0,
    totalExpenses: summary.totalExpenses,
    grossProfit: summary.totalIncome - summary.totalExpenses,
    netProfit: summary.netProfit,
    netOperatingCashFlow: summary.netProfit,
    netInvestingCashFlow: 0,
    netFinancingCashFlow: 0,
    totalCashFlow: summary.netProfit,
    totalTransactions: summary.totalTransactions,
    averageTransactionValue: summary.averageTransactionValue,
    topPaymentMethod: summary.topPaymentMethod,
  };
}

export function deriveCanonicalFinanceMetrics(
  aggregate?: Pick<
    FinanceAggregateResult,
    'summary' | 'trading' | 'cashMovement'
  >
): CanonicalFinanceMetrics {
  if (!aggregate) {
    return buildSummaryFallback({
      totalTransactions: 0,
      averageTransactionValue: 0,
      topPaymentMethod: '',
      totalIncome: 0,
      totalExpenses: 0,
      netProfit: 0,
    });
  }

  if (!aggregate.trading || !aggregate.cashMovement) {
    return buildSummaryFallback(aggregate.summary);
  }

  const operatingRevenue = aggregate.trading.operatingRevenue;
  const financingInflows = aggregate.cashMovement.ownerFunding;
  const costOfGoodsSold = aggregate.trading.costOfGoodsSold;
  const operatingExpenses = aggregate.trading.operatingExpenses;
  const totalExpenses = costOfGoodsSold + operatingExpenses;
  const netOperatingCashFlow = roundCurrency(
    aggregate.cashMovement.customerCollections +
      aggregate.cashMovement.manualIncomeCollections -
      aggregate.cashMovement.operatingExpensePayments
  );
  const netInvestingCashFlow = roundCurrency(
    -aggregate.cashMovement.stockPurchases
  );
  const netFinancingCashFlow = roundCurrency(financingInflows);

  return {
    posSalesRevenue: roundCurrency(aggregate.trading.salesRevenue),
    manualOperatingIncome: roundCurrency(
      aggregate.trading.manualOperatingIncome
    ),
    operatingRevenue: roundCurrency(operatingRevenue),
    financingInflows: roundCurrency(financingInflows),
    costOfGoodsSold: roundCurrency(costOfGoodsSold),
    operatingExpenses: roundCurrency(operatingExpenses),
    totalExpenses: roundCurrency(totalExpenses),
    grossProfit: roundCurrency(aggregate.trading.grossProfit),
    netProfit: roundCurrency(aggregate.trading.netProfit),
    netOperatingCashFlow,
    netInvestingCashFlow,
    netFinancingCashFlow,
    totalCashFlow: roundCurrency(aggregate.cashMovement.netCashMovement),
    totalTransactions: aggregate.summary.totalTransactions,
    averageTransactionValue: aggregate.summary.averageTransactionValue,
    topPaymentMethod: aggregate.summary.topPaymentMethod,
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
      cashIn: 0,
      cashOut: 0,
      transactions: 0,
    };

    current.revenue += transaction.profitIn;
    current.cashIn += transaction.cashIn;
    current.cashOut += transaction.cashOut;

    if (transaction.eventType === 'OWNER_FUNDING_IN') {
      current.financingInflows += transaction.cashIn;
    }

    if (
      transaction.eventType === 'POS_CASH_SALE' ||
      transaction.eventType === 'POS_DEBT_SALE_ISSUED'
    ) {
      current.costOfGoodsSold += transaction.profitOut;
    }

    if (transaction.eventType === 'MANUAL_OPERATING_EXPENSE') {
      current.operatingExpenses += transaction.profitOut;
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

      return {
        date,
        revenue: roundCurrency(values.revenue),
        financingInflows: roundCurrency(values.financingInflows),
        expenses: roundCurrency(expenses),
        costOfGoodsSold: roundCurrency(values.costOfGoodsSold),
        operatingExpenses: roundCurrency(values.operatingExpenses),
        grossProfit: roundCurrency(grossProfit),
        netProfit: roundCurrency(netProfit),
        netCashFlow: roundCurrency(values.cashIn - values.cashOut),
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
    .filter(
      transaction =>
        transaction.profitIn > 0 && transaction.eventType !== 'OWNER_FUNDING_IN'
    )
    .forEach(transaction => {
      const key =
        transaction.source === 'POS' ? 'POS_SALES' : transaction.category;
      const current = revenueBySource.get(key) || {
        revenue: 0,
        transactionCount: 0,
      };

      revenueBySource.set(key, {
        revenue: roundCurrency(current.revenue + transaction.profitIn),
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
  aggregate: Pick<
    FinanceAggregateResult,
    'summary' | 'trading' | 'cashMovement'
  >
): CanonicalFinanceMetrics {
  return deriveCanonicalFinanceMetrics(aggregate);
}
