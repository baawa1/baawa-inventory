import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";

export interface AnalyticsData {
  transactionStats: {
    totalSales: number;
    netSales: number;
    totalTransactions: number;
    totalItems: number;
    averageOrderValue: number;
  };
  salesData: Array<{
    date: string;
    sales: number;
    orders: number;
    netSales: number;
  }>;
  topCustomers: Array<{
    id: number;
    name: string;
    orders: number;
    totalSpend: number;
  }>;
  topCategories: Array<{
    id: number;
    name: string;
    itemsSold: number;
    netSales: number;
  }>;
  topProducts: Array<{
    id: number;
    name: string;
    itemsSold: number;
    netSales: number;
  }>;
  lowStockItems: Array<{
    id: number;
    name: string;
    sku: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
    price: number;
    category: string;
    supplier: string;
    lastRestocked: string;
    status: "critical" | "low" | "normal";
  }>;
}

export function useAnalytics(dateRange: string = "month") {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard(dateRange),
    queryFn: async (): Promise<AnalyticsData> => {
      const response = await fetch(
        `/api/dashboard/analytics?dateRange=${dateRange}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }
      const data = await response.json();
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
