import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ErrorHandlers } from '@/lib/utils/error-handling';

interface TransactionFilters {
  search?: string;
  type?: string;
  categoryId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface Transaction {
  id: number;
  transactionNumber: string;
  type: 'INCOME' | 'EXPENSE';
  categoryId: number;
  amount: number;
  currency: string;
  description: string | null;
  transactionDate: Date;
  paymentMethod: string | null;
  referenceNumber: string | null;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'APPROVED' | 'REJECTED';
  approvedBy: number | null;
  approvedAt: Date | null;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: number;
    name: string;
    type: string;
  };
  createdByUser: {
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedByUser?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  expenseDetails?: {
    id: number;
    expenseType: string;
    vendorName: string | null;
    vendorContact: string | null;
    taxAmount: number;
    taxRate: number;
    receiptUrl: string | null;
    notes: string | null;
    createdAt: Date;
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
    createdAt: Date;
  };
}

export interface TransactionsResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function useTransactions(filters: TransactionFilters = {}) {
  const queryKey = ['transactions', filters];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<TransactionsResponse> => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/finance/transactions?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return response.json();
    },
  });
}

export function useTransaction(id: number) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: async (): Promise<{ transaction: Transaction }> => {
      const response = await fetch(`/api/finance/transactions/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transaction');
      }
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      transactionData: any
    ): Promise<{ transaction: Transaction }> => {
      const response = await fetch('/api/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create transaction');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      toast.success('Transaction created successfully');
    },
    onError: ErrorHandlers.mutation,
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: any;
    }): Promise<{ transaction: Transaction }> => {
      const response = await fetch(`/api/finance/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update transaction');
      }

      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction', id] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      toast.success('Transaction updated successfully');
    },
    onError: ErrorHandlers.mutation,
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<{ message: string }> => {
      const response = await fetch(`/api/finance/transactions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete transaction');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });
      toast.success('Transaction deleted successfully');
    },
    onError: ErrorHandlers.mutation,
  });
}
