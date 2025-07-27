import { useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';

interface FinancialAnalyticsFilters {
  dateRange?: DateRange;
  type?: 'all' | 'income' | 'expense';
  paymentMethod?: string;
  groupBy?: 'day' | 'week' | 'month';
}

interface AnalyticsSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalTransactions: number;
  averageTransactionValue: number;
  topPaymentMethod: string;
  revenueGrowth: number;
  expenseGrowth: number;
}

interface ChartData {
  paymentMethodDistribution: Array<{
    name: string;
    value: number;
    amount: number;
  }>;
  dailyTrends: Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>;
}

interface FinancialAnalyticsData {
  summary: AnalyticsSummary;
  charts: ChartData;
  filters: {
    dateFrom?: string;
    dateTo?: string;
    type: string;
    paymentMethod?: string;
    groupBy: string;
  };
}

const fetchFinancialAnalytics = async (
  filters: FinancialAnalyticsFilters
): Promise<FinancialAnalyticsData> => {
  const params = new URLSearchParams();

  if (filters.dateRange?.from) {
    params.append(
      'dateFrom',
      filters.dateRange.from.toISOString().split('T')[0]
    );
  }
  if (filters.dateRange?.to) {
    params.append('dateTo', filters.dateRange.to.toISOString().split('T')[0]);
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

export function useFinancialAnalyticsSummary(
  filters: FinancialAnalyticsFilters = {}
) {
  const { data, ...rest } = useFinancialAnalytics(filters);

  return {
    ...rest,
    data: data?.summary,
  };
}

export function useFinancialAnalyticsCharts(
  filters: FinancialAnalyticsFilters = {}
) {
  const { data, ...rest } = useFinancialAnalytics(filters);

  return {
    ...rest,
    data: data?.charts,
  };
}
