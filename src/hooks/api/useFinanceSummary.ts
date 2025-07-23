import { useQuery } from "@tanstack/react-query";

interface FinanceSummaryFilters {
  startDate?: string;
  endDate?: string;
}

export interface FinanceSummary {
  currentMonth: {
    income: number;
    expenses: number;
    netIncome: number;
  };
  previousMonth: {
    income: number;
    expenses: number;
    netIncome: number;
  };
  yearToDate: {
    income: number;
    expenses: number;
    netIncome: number;
  };
  topCategories: {
    income: Array<{
      categoryId: number;
      categoryName: string;
      amount: number;
      percentage: number;
    }>;
    expenses: Array<{
      categoryId: number;
      categoryName: string;
      amount: number;
      percentage: number;
    }>;
  };
  recentTransactions: Array<{
    id: number;
    transactionNumber: string;
    type: "INCOME" | "EXPENSE";
    amount: number;
    description: string;
    transactionDate: Date;
    categoryName: string;
  }>;
}

// Fetch finance summary
export const useFinanceSummary = (filters: FinanceSummaryFilters = {}) => {
  const queryKey = ["finance-summary", filters];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<FinanceSummary> => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/finance/summary?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch finance summary");
      }
      const data = await response.json();

      // Return default structure if data is not available
      if (!data.data) {
        return {
          currentMonth: { income: 0, expenses: 0, netIncome: 0 },
          previousMonth: { income: 0, expenses: 0, netIncome: 0 },
          yearToDate: { income: 0, expenses: 0, netIncome: 0 },
          topCategories: { income: [], expenses: [] },
          recentTransactions: [],
        };
      }

      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
