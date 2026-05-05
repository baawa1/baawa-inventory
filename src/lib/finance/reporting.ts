import { format, subDays } from 'date-fns';
import {
  buildFinanceRange,
  type FinanceAggregateResult,
  type FinanceGroupBy,
  type FinanceRange,
  type NormalizedFinanceTransaction,
} from './ledger';
import {
  buildCanonicalFinanceTrends,
  summarizeCanonicalFinanceAggregate,
} from './metrics';

export const ACTIVE_FINANCE_REPORT_TYPES = [
  'FINANCIAL_SUMMARY',
  'INCOME_STATEMENT',
  'CASH_FLOW',
] as const;

export type FinanceReportType = (typeof ACTIVE_FINANCE_REPORT_TYPES)[number];

export type FinanceReportPeriod =
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

export interface FinanceReportLedgerRow
  extends Omit<NormalizedFinanceTransaction, 'date'> {
  date: string;
  transactionDate: string;
}

export interface FinanceReportPayload {
  reportType: FinanceReportType;
  period: FinanceReportPeriod;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  trading: FinanceAggregateResult['trading'];
  cashMovement: FinanceAggregateResult['cashMovement'];
  businessPosition: FinanceAggregateResult['businessPosition'];
  methodology: FinanceAggregateResult['methodology'];
  summary: {
    totalTransactions: number;
    totalIncome: number;
    totalExpenses: number;
    grossProfit: number;
    netProfit: number;
    averageTransactionValue: number;
    topPaymentMethod: string;
  };
  incomeStatement: {
    salesRevenueRecognised: number;
    otherOperatingIncome: number;
    totalOperatingIncome: number;
    costOfGoodsSold: number;
    grossProfit: number;
    operatingExpenses: number;
    netProfit: number;
  };
  cashFlowStatement: {
    cashReceived: number;
    cashSpent: number;
    customerCollections: number;
    manualIncomeCollections: number;
    ownerFunding: number;
    stockPurchaseCashOut: number;
    operatingExpensePayments: number;
    netOperatingCashFlow: number;
    netInvestingCashFlow: number;
    netFinancingCashFlow: number;
    netCashMovement: number;
  };
  paymentMethods: Array<{
    method: string;
    amount: number;
    count: number;
  }>;
  ledgerRows: FinanceReportLedgerRow[];
  trends: Array<{
    date: string;
    revenue: number;
    costOfGoodsSold: number;
    grossProfit: number;
    operatingExpenses: number;
    netProfit: number;
    financingInflows: number;
    netCashFlow: number;
    transactions: number;
  }>;
  profitLoss: {
    revenue: {
      sales: number;
      otherIncome: number;
      totalRevenue: number;
    };
    expenses: {
      costOfGoods: number;
      operatingExpenses: number;
      totalExpenses: number;
    };
    grossProfit: number;
    netProfit: number;
  };
  cashFlow: {
    operatingActivities: {
      netIncome: number;
      operatingRevenue: number;
      operatingExpenses: number;
      netOperatingCashFlow: number;
    };
    investingActivities: {
      capitalExpenditures: number;
      netInvestingCashFlow: number;
    };
    financingActivities: {
      ownerFunding: number;
      netFinancingCashFlow: number;
    };
  };
  totalCashFlow: number;
}

export type FinanceReportExportRow = Record<string, string | number>;

export interface FinanceReportPayloadWithExportRows extends FinanceReportPayload {
  exportRows: FinanceReportExportRow[];
}

export interface FinanceReportHistoryEntry {
  id: number;
  reportType: string;
  reportName: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  generatedBy: {
    id: number;
    name: string;
    email: string;
  };
  methodologyStatus: 'exact' | 'estimated' | 'unknown';
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function resolveTrendGroupBy(period: FinanceReportPeriod): FinanceGroupBy {
  if (period === 'yearly') {
    return 'month';
  }

  if (period === 'quarterly') {
    return 'week';
  }

  return 'day';
}

export function getFinanceReportTypeLabel(reportType: string): string {
  switch (reportType) {
    case 'FINANCIAL_SUMMARY':
      return 'Financial Summary';
    case 'INCOME_STATEMENT':
      return 'Income Statement';
    case 'CASH_FLOW':
      return 'Cash Flow';
    default:
      return reportType;
  }
}

export function buildFinanceReportName(
  reportType: string,
  range: Pick<FinanceRange, 'startDate' | 'endDate'>
): string {
  return `${getFinanceReportTypeLabel(reportType)} ${format(
    range.startDate,
    'dd MMM yyyy'
  )} to ${format(range.endDate, 'dd MMM yyyy')}`;
}

export function resolveFinanceReportRange(
  period: FinanceReportPeriod,
  dateFrom?: Date,
  dateTo?: Date
): FinanceRange {
  if (dateFrom || dateTo) {
    return buildFinanceRange(dateFrom, dateTo, 'month', {
      comparisonPeriod: 'custom',
    });
  }

  const now = new Date();

  switch (period) {
    case 'weekly':
      return buildFinanceRange(subDays(now, 6), now, 'month', {
        comparisonPeriod: 'week',
      });
    case 'quarterly': {
      const quarter = Math.floor(now.getMonth() / 3);
      return buildFinanceRange(
        new Date(now.getFullYear(), quarter * 3, 1),
        now,
        'month',
        { comparisonPeriod: 'quarter' }
      );
    }
    case 'yearly':
      return buildFinanceRange(new Date(now.getFullYear(), 0, 1), now, 'year', {
        comparisonPeriod: 'year',
      });
    case 'monthly':
    default:
      return buildFinanceRange(
        new Date(now.getFullYear(), now.getMonth(), 1),
        now,
        'month',
        { comparisonPeriod: 'month' }
      );
  }
}

export function buildFinanceReportPayload(
  aggregate: FinanceAggregateResult,
  options: {
    reportType: FinanceReportType;
    period: FinanceReportPeriod;
    range: FinanceRange;
  }
): FinanceReportPayload {
  const metrics = summarizeCanonicalFinanceAggregate(aggregate);
  const trends = buildCanonicalFinanceTrends(
    aggregate.transactions,
    resolveTrendGroupBy(options.period)
  );

  const incomeStatement = {
    salesRevenueRecognised: roundCurrency(metrics.posSalesRevenue),
    otherOperatingIncome: roundCurrency(metrics.manualOperatingIncome),
    totalOperatingIncome: roundCurrency(metrics.operatingRevenue),
    costOfGoodsSold: roundCurrency(metrics.costOfGoodsSold),
    grossProfit: roundCurrency(metrics.grossProfit),
    operatingExpenses: roundCurrency(metrics.operatingExpenses),
    netProfit: roundCurrency(metrics.netProfit),
  };

  const cashFlowStatement = {
    cashReceived: roundCurrency(aggregate.cashMovement.cashReceived),
    cashSpent: roundCurrency(aggregate.cashMovement.cashSpent),
    customerCollections: roundCurrency(
      aggregate.cashMovement.customerCollections
    ),
    manualIncomeCollections: roundCurrency(
      aggregate.cashMovement.manualIncomeCollections
    ),
    ownerFunding: roundCurrency(aggregate.cashMovement.ownerFunding),
    stockPurchaseCashOut: roundCurrency(aggregate.cashMovement.stockPurchases),
    operatingExpensePayments: roundCurrency(
      aggregate.cashMovement.operatingExpensePayments
    ),
    netOperatingCashFlow: roundCurrency(metrics.netOperatingCashFlow),
    netInvestingCashFlow: roundCurrency(metrics.netInvestingCashFlow),
    netFinancingCashFlow: roundCurrency(metrics.netFinancingCashFlow),
    netCashMovement: roundCurrency(aggregate.cashMovement.netCashMovement),
  };

  return {
    reportType: options.reportType,
    period: options.period,
    dateRange: {
      startDate: options.range.startDate.toISOString(),
      endDate: options.range.endDate.toISOString(),
    },
    trading: aggregate.trading,
    cashMovement: aggregate.cashMovement,
    businessPosition: aggregate.businessPosition,
    methodology: aggregate.methodology,
    summary: {
      totalTransactions: aggregate.summary.totalTransactions,
      totalIncome: roundCurrency(metrics.operatingRevenue),
      totalExpenses: roundCurrency(metrics.totalExpenses),
      grossProfit: roundCurrency(metrics.grossProfit),
      netProfit: roundCurrency(metrics.netProfit),
      averageTransactionValue: roundCurrency(metrics.averageTransactionValue),
      topPaymentMethod: aggregate.summary.topPaymentMethod,
    },
    incomeStatement,
    cashFlowStatement,
    paymentMethods: aggregate.paymentMethodDistribution.map(item => ({
      method: item.method,
      amount: roundCurrency(item.amount),
      count: item.count,
    })),
    ledgerRows: aggregate.transactions.map(transaction => ({
      ...transaction,
      date: transaction.date.toISOString(),
      transactionDate: transaction.date.toISOString(),
    })),
    trends: trends.map(item => ({
      date: item.date,
      revenue: roundCurrency(item.revenue),
      costOfGoodsSold: roundCurrency(item.costOfGoodsSold),
      grossProfit: roundCurrency(item.grossProfit),
      operatingExpenses: roundCurrency(item.operatingExpenses),
      netProfit: roundCurrency(item.netProfit),
      financingInflows: roundCurrency(item.financingInflows),
      netCashFlow: roundCurrency(item.netCashFlow),
      transactions: item.transactions,
    })),
    profitLoss: {
      revenue: {
        sales: incomeStatement.salesRevenueRecognised,
        otherIncome: incomeStatement.otherOperatingIncome,
        totalRevenue: incomeStatement.totalOperatingIncome,
      },
      expenses: {
        costOfGoods: incomeStatement.costOfGoodsSold,
        operatingExpenses: incomeStatement.operatingExpenses,
        totalExpenses: roundCurrency(metrics.totalExpenses),
      },
      grossProfit: incomeStatement.grossProfit,
      netProfit: incomeStatement.netProfit,
    },
    cashFlow: {
      operatingActivities: {
        netIncome: incomeStatement.netProfit,
        operatingRevenue: incomeStatement.totalOperatingIncome,
        operatingExpenses: incomeStatement.operatingExpenses,
        netOperatingCashFlow: cashFlowStatement.netOperatingCashFlow,
      },
      investingActivities: {
        capitalExpenditures: cashFlowStatement.stockPurchaseCashOut,
        netInvestingCashFlow: cashFlowStatement.netInvestingCashFlow,
      },
      financingActivities: {
        ownerFunding: cashFlowStatement.ownerFunding,
        netFinancingCashFlow: cashFlowStatement.netFinancingCashFlow,
      },
    },
    totalCashFlow: cashFlowStatement.netCashMovement,
  };
}

export function buildFinanceReportExportRows(
  payload: FinanceReportPayload,
  reportType: FinanceReportType
): FinanceReportExportRow[] {
  switch (reportType) {
    case 'INCOME_STATEMENT':
      return [
        {
          Section: 'Trading Performance',
          Line: 'Sales Revenue Recognised',
          Amount: payload.incomeStatement.salesRevenueRecognised,
        },
        {
          Section: 'Trading Performance',
          Line: 'Other Operating Income',
          Amount: payload.incomeStatement.otherOperatingIncome,
        },
        {
          Section: 'Trading Performance',
          Line: 'Total Operating Income',
          Amount: payload.incomeStatement.totalOperatingIncome,
        },
        {
          Section: 'Trading Performance',
          Line: 'Cost Of Goods Sold',
          Amount: payload.incomeStatement.costOfGoodsSold,
        },
        {
          Section: 'Trading Performance',
          Line: 'Gross Profit',
          Amount: payload.incomeStatement.grossProfit,
        },
        {
          Section: 'Trading Performance',
          Line: 'Operating Expenses',
          Amount: payload.incomeStatement.operatingExpenses,
        },
        {
          Section: 'Trading Performance',
          Line: 'Net Profit',
          Amount: payload.incomeStatement.netProfit,
        },
      ];
    case 'CASH_FLOW':
      return [
        {
          Section: 'Cash Movement',
          Line: 'Customer Collections',
          Amount: payload.cashFlowStatement.customerCollections,
        },
        {
          Section: 'Cash Movement',
          Line: 'Manual Income Collections',
          Amount: payload.cashFlowStatement.manualIncomeCollections,
        },
        {
          Section: 'Cash Movement',
          Line: 'Owner Funding',
          Amount: payload.cashFlowStatement.ownerFunding,
        },
        {
          Section: 'Cash Movement',
          Line: 'Operating Expense Payments',
          Amount: payload.cashFlowStatement.operatingExpensePayments,
        },
        {
          Section: 'Cash Movement',
          Line: 'Stock Purchase Cash Out',
          Amount: payload.cashFlowStatement.stockPurchaseCashOut,
        },
        {
          Section: 'Cash Movement',
          Line: 'Net Operating Cash Flow',
          Amount: payload.cashFlowStatement.netOperatingCashFlow,
        },
        {
          Section: 'Cash Movement',
          Line: 'Net Investing Cash Flow',
          Amount: payload.cashFlowStatement.netInvestingCashFlow,
        },
        {
          Section: 'Cash Movement',
          Line: 'Net Financing Cash Flow',
          Amount: payload.cashFlowStatement.netFinancingCashFlow,
        },
        {
          Section: 'Cash Movement',
          Line: 'Net Cash Movement',
          Amount: payload.cashFlowStatement.netCashMovement,
        },
      ];
    case 'FINANCIAL_SUMMARY':
    default:
      return [
        {
          Section: 'Trading Performance',
          Line: 'Sales Revenue Recognised',
          Amount: payload.incomeStatement.salesRevenueRecognised,
        },
        {
          Section: 'Trading Performance',
          Line: 'Other Operating Income',
          Amount: payload.incomeStatement.otherOperatingIncome,
        },
        {
          Section: 'Trading Performance',
          Line: 'Cost Of Goods Sold',
          Amount: payload.incomeStatement.costOfGoodsSold,
        },
        {
          Section: 'Trading Performance',
          Line: 'Operating Expenses',
          Amount: payload.incomeStatement.operatingExpenses,
        },
        {
          Section: 'Trading Performance',
          Line: 'Net Profit',
          Amount: payload.incomeStatement.netProfit,
        },
        {
          Section: 'Cash Movement',
          Line: 'Cash Received',
          Amount: payload.cashFlowStatement.cashReceived,
        },
        {
          Section: 'Cash Movement',
          Line: 'Cash Spent',
          Amount: payload.cashFlowStatement.cashSpent,
        },
        {
          Section: 'Cash Movement',
          Line: 'Net Cash Movement',
          Amount: payload.cashFlowStatement.netCashMovement,
        },
        {
          Section: 'Business Position',
          Line: 'Inventory Value On Hand',
          Amount: payload.businessPosition.inventoryValueOnHand,
        },
        {
          Section: 'Business Position',
          Line: 'Inventory Units On Hand',
          Amount: payload.businessPosition.inventoryUnitsOnHand,
        },
        {
          Section: 'Business Position',
          Line: 'Receivables Outstanding',
          Amount: payload.businessPosition.receivablesOutstanding,
        },
        {
          Section: 'Business Position',
          Line: 'Customers With Balances',
          Amount: payload.businessPosition.customersWithBalances,
        },
      ];
  }
}

export function getFinanceReportMethodologyStatus(
  reportData: unknown
): 'exact' | 'estimated' | 'unknown' {
  if (!reportData || typeof reportData !== 'object') {
    return 'unknown';
  }

  const candidate = reportData as {
    methodology?: {
      status?: string;
    };
  };

  if (candidate.methodology?.status === 'exact') {
    return 'exact';
  }

  if (candidate.methodology?.status === 'estimated') {
    return 'estimated';
  }

  return 'unknown';
}
