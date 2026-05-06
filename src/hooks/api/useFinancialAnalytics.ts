import { useQuery } from '@tanstack/react-query';
import type { DateRange } from 'react-day-picker';
import { formatFinanceDateInput } from '@/lib/finance/date-range';

export interface FinancialAnalyticsFilters {
  dateRange?: DateRange;
  type?: 'all' | 'income' | 'expense';
  paymentMethod?: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface FinancialAnalyticsData {
  overview: {
    trading: {
      salesRevenue: number;
      manualOperatingIncome: number;
      operatingRevenue: number;
      costOfGoodsSold: number;
      operatingExpenses: number;
      grossProfit: number;
      netProfit: number;
    };
    cashMovement: {
      cashReceived: number;
      cashSpent: number;
      customerCollections: number;
      ownerFunding: number;
      stockPurchases: number;
      operatingExpensePayments: number;
      manualIncomeCollections: number;
      netCashMovement: number;
    };
    businessPosition: {
      inventoryValueOnHand: number;
      inventoryUnitsOnHand: number;
      inventorySkusTracked: number;
      receivablesOutstanding: number;
      receivableTransactions: number;
      customersWithBalances: number;
      estimated: boolean;
      estimatedReasons: string[];
    };
    activity: {
      totalTransactions: number;
      averageTransactionValue: number;
      topPaymentMethod: string;
      revenueGrowth: number;
      expenseGrowth: number;
      netProfitGrowth: number;
      netCashGrowth: number;
    };
  };
  tradingTrends: Array<{
    period: string;
    revenue: number;
    costOfGoodsSold: number;
    grossProfit: number;
    operatingExpenses: number;
    netProfit: number;
    transactions: number;
  }>;
  cashTrends: Array<{
    period: string;
    cashReceived: number;
    cashSpent: number;
    customerCollections: number;
    manualIncomeCollections: number;
    ownerFunding: number;
    stockPurchases: number;
    operatingExpensePayments: number;
    netCashMovement: number;
  }>;
  revenueBySource: Array<{
    source: string;
    revenue: number;
    transactionCount: number;
  }>;
  expenseBreakdown: Array<{
    category: string;
    label: string;
    amount: number;
  }>;
  receivables: {
    summary: {
      totalOutstanding: number;
      totalTransactions: number;
      averageDaysOutstanding: number;
      customersWithBalances: number;
    };
    aging: {
      '0-30': { count: number; amount: number };
      '31-60': { count: number; amount: number };
      '61-90': { count: number; amount: number };
      '90+': { count: number; amount: number };
    };
    topDebtors: Array<{
      customerName: string;
      totalOwed: number;
      transactionCount: number;
    }>;
  };
  health: {
    profitMargin: number;
    operatingExpenseRatio: number;
    averageTransactionValue: number;
    estimatedCashPosition: number;
    healthScore: number;
    status: 'healthy' | 'monitor' | 'at-risk';
  };
  methodology: {
    status: 'exact' | 'estimated';
    estimated: boolean;
    rebuiltFromOperationalData: boolean;
    historicalRebuild: 'best_effort';
    reasons: string[];
  };
  filters: {
    dateFrom: string;
    dateTo: string;
    type: string;
    paymentMethod?: string;
    groupBy: 'day' | 'week' | 'month';
  };
}

const fetchFinancialAnalytics = async (
  filters: FinancialAnalyticsFilters
): Promise<FinancialAnalyticsData> => {
  const params = new URLSearchParams();

  if (filters.dateRange?.from) {
    params.append('dateFrom', formatFinanceDateInput(filters.dateRange.from));
  }
  if (filters.dateRange?.to) {
    params.append('dateTo', formatFinanceDateInput(filters.dateRange.to));
  }
  if (filters.type && filters.type !== 'all') {
    params.append('type', filters.type);
  }
  if (filters.paymentMethod && filters.paymentMethod !== 'all') {
    params.append('paymentMethod', filters.paymentMethod);
  }
  if (filters.groupBy) {
    params.append('groupBy', filters.groupBy);
  }

  const response = await fetch(`/api/finance/analytics?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch financial analytics data');
  }

  const result = await response.json();
  return result.data;
};

export function useFinancialAnalytics(filters: FinancialAnalyticsFilters = {}) {
  return useQuery({
    queryKey: ['financial-analytics', filters],
    queryFn: () => fetchFinancialAnalytics(filters),
    staleTime: 5 * 60 * 1000,
  });
}
