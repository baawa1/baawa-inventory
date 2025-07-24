import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  TransactionFilters,
  ReportFilters,
  CreateTransactionData,
  UpdateTransactionData,
} from "@/lib/validations/finance";

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
  approvedBy: number | null;
  approvedAt: Date | null;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  expenseDetails?: {
    id: number;
    expenseType: string;
    vendorName: string | null;
    vendorContact: string | null;
    taxAmount: number;
    taxRate: number;
    receiptUrl: string | null;
    notes: string | null;
  };
  incomeDetails?: {
    id: number;
    incomeSource: string;
    payerName: string | null;
    payerContact: string | null;
    taxWithheld: number;
    taxRate: number;
    receiptUrl: string | null;
    notes: string | null;
  };
  createdByUser: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedByUser?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  pendingTransactions: number;
  recentTransactions: FinancialTransaction[];
}

export interface FinancialReport {
  id: number;
  reportType: string;
  reportName: string;
  periodStart: Date;
  periodEnd: Date;
  reportData: any;
  generatedBy: number;
  generatedAt: Date;
  fileUrl: string | null;
  generatedByUser: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Fetch financial transactions with filters
export const useFinancialTransactions = (
  filters: TransactionFilters = { page: 1, limit: 10, sortOrder: "desc" }
) => {
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
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/finance/transactions?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch financial transactions");
      }
      const data = await response.json();
      return data.data || { transactions: [], total: 0, page: 1, limit: 10 };
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

      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("Transaction created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create transaction");
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
      const { id, ...updateData } = data;
      const response = await fetch(`/api/finance/transactions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update transaction");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
      queryClient.invalidateQueries({
        queryKey: ["financial-transaction", data.id],
      });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("Transaction updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update transaction");
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
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("Transaction deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete transaction");
    },
  });
};

// Approve transaction
export const useApproveTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<FinancialTransaction> => {
      const response = await fetch(`/api/finance/transactions/${id}/approve`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to approve transaction");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
      queryClient.invalidateQueries({
        queryKey: ["financial-transaction", data.id],
      });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("Transaction approved successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to approve transaction");
    },
  });
};

// Reject transaction
export const useRejectTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      reason,
    }: {
      id: number;
      reason: string;
    }): Promise<FinancialTransaction> => {
      const response = await fetch(`/api/finance/transactions/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reject transaction");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
      queryClient.invalidateQueries({
        queryKey: ["financial-transaction", data.id],
      });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("Transaction rejected successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reject transaction");
    },
  });
};

// Get financial summary
export const useFinancialSummary = () => {
  return useQuery({
    queryKey: ["financial-summary"],
    queryFn: async (): Promise<FinancialSummary> => {
      const response = await fetch("/api/finance/summary");
      if (!response.ok) {
        throw new Error("Failed to fetch financial summary");
      }
      const data = await response.json();
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Generate financial report
export const useGenerateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (filters: ReportFilters): Promise<FinancialReport> => {
      const response = await fetch("/api/finance/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate report");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-reports"] });
      toast.success("Report generated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate report");
    },
  });
};

// Get financial reports
export const useFinancialReports = () => {
  return useQuery({
    queryKey: ["financial-reports"],
    queryFn: async (): Promise<FinancialReport[]> => {
      const response = await fetch("/api/finance/reports");
      if (!response.ok) {
        throw new Error("Failed to fetch financial reports");
      }
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
