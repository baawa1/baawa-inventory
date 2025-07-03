import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";

// Types for inventory metrics
interface InventoryStats {
  totalProducts: number;
  lowStockItems: number;
  totalStockValue: number;
  activeSuppliers: number;
  recentSales: number;
  stockMovement: number;
}

interface StockData {
  month: string;
  stockIn: number;
  stockOut: number;
}

interface SalesData {
  category: string;
  sales: number;
  revenue: number;
}

interface RecentActivityItem {
  id: string;
  type: "stock_in" | "stock_out" | "adjustment" | "sale";
  description: string;
  timestamp: string;
  amount?: number;
  user?: string;
}

// API Functions
const fetchInventoryStats = async (): Promise<InventoryStats> => {
  const response = await fetch("/api/inventory/stats");
  if (!response.ok) {
    throw new Error(`Failed to fetch inventory stats: ${response.statusText}`);
  }
  return response.json();
};

const fetchInventoryCharts = async (): Promise<{
  stockData: StockData[];
  salesData: SalesData[];
}> => {
  const response = await fetch("/api/inventory/charts");
  if (!response.ok) {
    throw new Error(`Failed to fetch inventory charts: ${response.statusText}`);
  }
  return response.json();
};

const fetchRecentActivity = async (): Promise<RecentActivityItem[]> => {
  const response = await fetch("/api/inventory/activity/recent");
  if (!response.ok) {
    throw new Error(`Failed to fetch recent activity: ${response.statusText}`);
  }
  const data = await response.json();
  return data.activities || data.data || data;
};

// Query Hooks
export function useInventoryStats() {
  return useQuery({
    queryKey: queryKeys.inventory.metrics(),
    queryFn: fetchInventoryStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

export function useInventoryCharts() {
  return useQuery({
    queryKey: queryKeys.inventory.charts(),
    queryFn: fetchInventoryCharts,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: queryKeys.inventory.activity(),
    queryFn: fetchRecentActivity,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes for real-time feel
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}

// Export types for use in components
export type { InventoryStats, StockData, SalesData, RecentActivityItem };
