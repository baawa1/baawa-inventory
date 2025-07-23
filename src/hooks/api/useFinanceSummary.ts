import { useQuery } from "@tanstack/react-query";

export interface FinancialSummary {
  period: {
    type: string;
    start: string;
    end: string;
  };
  current: {
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
    transactionCount: number;
  };
  previous: {
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
    transactionCount: number;
  };
  changes: {
    income: number;
    expense: number;
    net: number;
  };
  categoryBreakdown: Array<{
    name: string;
    type: string;
    amount: number;
    count: number;
  }>;
  recentTransactions: Array<{
    id: number;
    transactionNumber: string;
    type: string;
    amount: number;
    description: string | null;
    transactionDate: Date;
    status: string;
    category: {
      name: string;
    };
    createdByUser: {
      firstName: string;
      lastName: string;
    };
  }>;
  pendingCount: number;
  lastUpdated: string;
}

interface SummaryFilters {
  period?: "month" | "quarter" | "year";
  compareWith?: "previous" | "lastYear";
}

export function useFinanceSummary(filters: SummaryFilters = {}) {
  const queryKey = ["finance-summary", filters];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<{ summary: FinancialSummary }> => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/finance/summary?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch financial summary");
      }
      return response.json();
    },
    // Refetch every 5 minutes to keep data fresh
    refetchInterval: 5 * 60 * 1000,
  });
}

// Convenience hooks for specific periods
export function useMonthlyFinanceSummary() {
  return useFinanceSummary({ period: "month" });
}

export function useQuarterlyFinanceSummary() {
  return useFinanceSummary({ period: "quarter" });
}

export function useYearlyFinanceSummary() {
  return useFinanceSummary({ period: "year" });
}