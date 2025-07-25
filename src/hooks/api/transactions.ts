import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { PAYMENT_METHODS, TRANSACTION_STATUS } from "@/lib/constants";

// Types
export interface TransactionItem {
  id: number;
  productId: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Transaction {
  id: number;
  transactionNumber: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  staffName: string;
  staffId: number;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export interface TransactionFilters {
  search: string;
  paymentMethod: string;
  paymentStatus: string;
  dateFrom: string;
  dateTo: string;
  staffId: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface TransactionPagination {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}

export interface TransactionListResponse {
  data: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TransactionStats {
  totalSales: number;
  totalTransactions: number;
  averageOrderValue: number;
  totalItems: number;
  totalDiscount: number;
  netSales: number;
  salesChange: number;
  transactionsChange: number;
  itemsChange: number;
  averageOrderValueChange: number;
  overallTotalSales: number;
  overallTotalTransactions: number;
  overallTotalItems: number;
}

// API Functions
const fetchTransactions = async (
  filters: Partial<TransactionFilters>,
  pagination: Partial<TransactionPagination>
): Promise<TransactionListResponse> => {
  const searchParams = new URLSearchParams({
    page: pagination.page?.toString() || "1",
    limit: pagination.limit?.toString() || "10",
    sortBy: filters.sortBy || "createdAt",
    sortOrder: filters.sortOrder || "desc",
  });

  if (filters.search) searchParams.set("search", filters.search);
  if (filters.paymentMethod && filters.paymentMethod !== "all")
    searchParams.set("paymentMethod", filters.paymentMethod);
  if (filters.paymentStatus && filters.paymentStatus !== "all")
    searchParams.set("paymentStatus", filters.paymentStatus);
  if (filters.dateFrom) searchParams.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) searchParams.set("dateTo", filters.dateTo);
  if (filters.staffId && filters.staffId !== "all")
    searchParams.set("staffId", filters.staffId);

  const response = await fetch(`/api/sales?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch transactions: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
};

const fetchTransactionById = async (id: number): Promise<Transaction> => {
  const response = await fetch(`/api/sales/${id}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch transaction: ${response.status} ${response.statusText}`
    );
  }
  const data = await response.json();
  return data.data || data;
};

const fetchTransactionStats = async (
  dateFrom?: string,
  dateTo?: string
): Promise<TransactionStats> => {
  const searchParams = new URLSearchParams();
  if (dateFrom) searchParams.set("dateFrom", dateFrom);
  if (dateTo) searchParams.set("dateTo", dateTo);

  const response = await fetch(`/api/sales/stats?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch transaction stats: ${response.status} ${response.statusText}`
    );
  }
  const data = await response.json();
  return data.data || data;
};

// TanStack Query Hooks
export function useTransactions(
  filters: Partial<TransactionFilters> = {},
  pagination: Partial<TransactionPagination> = {}
) {
  return useQuery({
    queryKey: queryKeys.transactions.list({ filters, pagination }),
    queryFn: () => fetchTransactions(filters, pagination),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useTransaction(id: number) {
  return useQuery({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: () => fetchTransactionById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useTransactionStats(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: queryKeys.transactions.stats({ dateFrom, dateTo }),
    queryFn: () => fetchTransactionStats(dateFrom, dateTo),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation hooks
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/sales/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`Failed to update transaction: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/sales/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Failed to delete transaction: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    },
  });
}

// Utility functions
export const getPaymentMethodLabel = (method: string): string => {
  switch (method) {
    case PAYMENT_METHODS.CASH:
      return "Cash";
    case PAYMENT_METHODS.BANK_TRANSFER:
      return "Bank Transfer";
    case PAYMENT_METHODS.MOBILE_MONEY:
      return "Mobile Money";
    default:
      return method;
  }
};

export const getPaymentStatusLabel = (status: string): string => {
  switch (status) {
    case TRANSACTION_STATUS.PENDING:
      return "Pending";
    case TRANSACTION_STATUS.COMPLETED:
      return "Completed";
    case TRANSACTION_STATUS.CANCELLED:
      return "Cancelled";
    case TRANSACTION_STATUS.REFUNDED:
      return "Refunded";
    default:
      return status;
  }
};

export const getPaymentStatusColor = (status: string): string => {
  switch (status) {
    case TRANSACTION_STATUS.PENDING:
      return "bg-yellow-100 text-yellow-800";
    case TRANSACTION_STATUS.COMPLETED:
      return "bg-green-100 text-green-800";
    case TRANSACTION_STATUS.CANCELLED:
      return "bg-red-100 text-red-800";
    case TRANSACTION_STATUS.REFUNDED:
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
