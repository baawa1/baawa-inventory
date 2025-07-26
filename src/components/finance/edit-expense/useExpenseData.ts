import { useQuery } from "@tanstack/react-query";

interface ExpenseData {
  id: number;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string | null;
  transactionDate: Date;
  paymentMethod: string | null;
  notes: string | null;
  expenseDetails?: {
    id: number;
    expenseType: string;
    vendorName: string | null;
  };
}

export function useExpenseData(expenseId: string) {
  return useQuery({
    queryKey: ["expense", expenseId],
    queryFn: async (): Promise<ExpenseData> => {
      const response = await fetch(`/api/finance/transactions/${expenseId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch expense data");
      }
      const data = await response.json();
      // API returns { success: true, data: transaction, message?: string }
      return data.data;
    },
    enabled: !!expenseId,
  });
}
