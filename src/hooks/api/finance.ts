import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { logger } from '@/lib/logger';

// Types
export interface FinancialTransaction {
  id: number;
  transactionNumber: string;
  type: 'EXPENSE' | 'INCOME';
  amount: number;
  description?: string;
  transactionDate: string;
  paymentMethod?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  createdByName: string;
  approvedBy?: number;
  approvedByName?: string;
  approvedAt?: string;
  expenseDetails?: {
    expenseType: string;
    vendorName?: string;
  };
  incomeDetails?: {
    incomeSource: string;
    payerName?: string;
  };
}

export interface FinancialTransactionFilters {
  search: string;
  type: string;
  status: string;
  paymentMethod: string;
  date: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface FinancialTransactionPagination {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}

export interface FinancialTransactionListResponse {
  data: FinancialTransaction[];
  pagination: FinancialTransactionPagination;
}

// API Functions
const fetchFinancialTransactions = async (
  filters: Partial<FinancialTransactionFilters>,
  pagination: Partial<FinancialTransactionPagination>
): Promise<FinancialTransactionListResponse> => {
  const searchParams = new URLSearchParams({
    page: pagination.page?.toString() || '1',
    limit: pagination.limit?.toString() || '10',
    sortBy: filters.sortBy || 'createdAt',
    sortOrder: filters.sortOrder || 'desc',
  });

  if (filters.search) searchParams.set('search', filters.search);
  if (filters.type && filters.type !== 'all')
    searchParams.set('type', filters.type);
  if (filters.status && filters.status !== 'all')
    searchParams.set('status', filters.status);
  if (filters.paymentMethod && filters.paymentMethod !== 'all')
    searchParams.set('paymentMethod', filters.paymentMethod);
  if (filters.date && filters.date !== 'all')
    searchParams.set('date', filters.date);

  const response = await fetch(
    `/api/finance/transactions?${searchParams.toString()}`
  );
  if (!response.ok) {
    throw new Error(
      `Failed to fetch financial transactions: ${response.status} ${response.statusText}`
    );
  }
  const data = await response.json();
  return data.data || data;
};

const fetchFinancialTransactionById = async (
  id: number
): Promise<FinancialTransaction> => {
  const response = await fetch(`/api/finance/transactions/${id}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch financial transaction: ${response.status} ${response.statusText}`
    );
  }
  const data = await response.json();
  return data.data || data;
};

// TanStack Query Hooks
export function useFinancialTransactions(
  filters: Partial<FinancialTransactionFilters> = {},
  pagination: Partial<FinancialTransactionPagination> = {}
) {
  return useQuery({
    queryKey: queryKeys.finance.transactions.list({ filters, pagination }),
    queryFn: () => fetchFinancialTransactions(filters, pagination),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useFinancialTransaction(id: number) {
  return useQuery({
    queryKey: queryKeys.finance.transactions.detail(id),
    queryFn: () => fetchFinancialTransactionById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook for fetching financial reports
export function useFinancialReports(params: {
  period?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  type?: 'all' | 'income' | 'expense';
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: ['financial-reports', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params.period) searchParams.append('period', params.period);
      if (params.type) searchParams.append('type', params.type);
      if (params.paymentMethod)
        searchParams.append('paymentMethod', params.paymentMethod);
      if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) searchParams.append('dateTo', params.dateTo);

      const response = await fetch(
        `/api/finance/reports?${searchParams.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('Failed to fetch financial reports', {
          status: response.status,
          error: errorData,
        });
        throw new Error(
          errorData.message || 'Failed to fetch financial reports'
        );
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Mutation hooks
export function useCreateFinancialTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(
          `Failed to create financial transaction: ${response.statusText}`
        );
      }
      const result = await response.json();
      return result.data || result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.finance.transactions.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.finance.summary(),
      });
    },
  });
}

export function useUpdateFinancialTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/finance/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(
          `Failed to update financial transaction: ${response.statusText}`
        );
      }
      const result = await response.json();
      return result.data || result;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.finance.transactions.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.finance.transactions.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.finance.summary(),
      });
    },
  });
}

export function useDeleteFinancialTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/finance/transactions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(
          `Failed to delete financial transaction: ${response.statusText}`
        );
      }
      const result = await response.json();
      return result.data || result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.finance.transactions.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.finance.summary(),
      });
    },
  });
}
