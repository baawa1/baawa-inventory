import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UpdateExpenseData {
  amount: number;
  description: string;
  transactionDate: string;
  paymentMethod: string;
  expenseType: string;
  vendorName?: string;
  notes?: string;
}

export function useExpenseUpdate() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const updateExpenseMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateExpenseData;
    }) => {
      const response = await fetch(`/api/finance/transactions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update expense");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Expense updated successfully");
      queryClient.invalidateQueries({ queryKey: ["expense"] });
      queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
      router.push("/finance/expenses");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    updateExpense: updateExpenseMutation.mutateAsync,
    isUpdating: updateExpenseMutation.isPending,
  };
}
