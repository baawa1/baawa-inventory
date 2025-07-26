import { useQuery } from "@tanstack/react-query";

interface IncomeData {
  id: number;
  amount: number;
  description: string | null;
  transactionDate: Date;
  paymentMethod: string | null;
  notes: string | null;
  incomeDetails?: {
    id: number;
    incomeSource: string;
    payerName: string | null;
  };
}

export function useIncomeData(incomeId: string) {
  return useQuery({
    queryKey: ["income", incomeId],
    queryFn: async (): Promise<IncomeData> => {
      const response = await fetch(`/api/finance/transactions/${incomeId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch income data");
      }
      const data = await response.json();
      // API returns { success: true, data: transaction, message?: string }
      return data.data;
    },
    enabled: !!incomeId,
  });
}
