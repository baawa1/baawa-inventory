import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface TransactionFilters {
  search?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface FinancialTransaction {
  id: number;
  transactionNumber: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  currency: string;
  description: string | null;
  transactionDate: Date;
  paymentMethod: string | null;
  referenceNumber: string | null;
  status: "PENDING" | "COMPLETED" | "CANCELLED" | "APPROVED" | "REJECTED";
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateTransactionData {
  type: "INCOME" | "EXPENSE";
  amount: number;
  currency: string;
  description: string;
  transactionDate: Date;
  paymentMethod: string;
  referenceNumber?: string;
}

interface UpdateTransactionData extends Partial<CreateTransactionData> {
  id: number;
}

// Fetch financial transactions
export const useFinancialTransactions = (filters: TransactionFilters = {}) => {
  const queryKey = ["financial-transactions", filters];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<{
      transactions: FinancialTransaction[];
      total: number;
      page: number;
      limit: number;
    }> => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/finance/transactions?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch financial transactions");
      }
      const data = await response.json();
      return {
        transactions: data.data || [],
        total: data.pagination?.total || 0,
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 10,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get single transaction
export const useFinancialTransaction = (id: number) => {
  return useQuery({
    queryKey: ["financial-transaction", id],
    queryFn: async (): Promise<FinancialTransaction> => {
      const response = await fetch(`/api/finance/transactions/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch transaction");
      }
      const data = await response.json();
      return data.data;
    },
    enabled: !!id,
  });
};

// Create transaction
export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateTransactionData
    ): Promise<FinancialTransaction> => {
      const response = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create transaction");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      toast.success("Transaction created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Update transaction
export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: UpdateTransactionData
    ): Promise<FinancialTransaction> => {
      const response = await fetch(`/api/finance/transactions/${data.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update transaction");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
      queryClient.invalidateQueries({
        queryKey: ["financial-transaction", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      toast.success("Transaction updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Delete transaction
export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const response = await fetch(`/api/finance/transactions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete transaction");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      toast.success("Transaction deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
