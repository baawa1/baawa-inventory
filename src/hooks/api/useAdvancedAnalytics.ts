import { useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';

interface AdvancedAnalyticsFilters {
  dateRange?: DateRange;
  type?: 'all' | 'income' | 'expense';
  paymentMethod?: string;
}

interface TrendAnalysis {
  revenue: {
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  expenses: {
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  profit: {
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  transactions: {
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
}

interface PerformanceMetrics {
  profitMargin: number;
  averageTransactionValue: number;
  revenuePerTransaction: number;
  expenseRatio: number;
}

interface Predictions {
  nextMonthRevenue: number;
  nextMonthExpenses: number;
  nextMonthProfit: number;
  growthRate: number;
}

interface AdvancedAnalyticsData {
  trendAnalysis: TrendAnalysis;
  performanceMetrics: PerformanceMetrics;
  predictions: Predictions;
}

const fetchAdvancedAnalytics = async (
  filters: AdvancedAnalyticsFilters
): Promise<AdvancedAnalyticsData> => {
  const params = new URLSearchParams();

  if (filters.dateRange?.from) {
    params.append(
      'fromDate',
      filters.dateRange.from.toISOString().split('T')[0]
    );
  }
  if (filters.dateRange?.to) {
    params.append('toDate', filters.dateRange.to.toISOString().split('T')[0]);
  }
  if (filters.type && filters.type !== 'all') {
    params.append('type', filters.type);
  }
  if (filters.paymentMethod && filters.paymentMethod !== 'all') {
    params.append('paymentMethod', filters.paymentMethod);
  }

  const response = await fetch(
    `/api/finance/advanced-analytics?${params.toString()}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch advanced analytics data');
  }

  const result = await response.json();
  return result.data;
};

export function useAdvancedAnalytics(filters: AdvancedAnalyticsFilters = {}) {
  return useQuery({
    queryKey: ['advanced-analytics', filters],
    queryFn: () => fetchAdvancedAnalytics(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}
