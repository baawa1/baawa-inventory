import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { logger } from '@/lib/logger';
import type {
  FinanceReportHistoryEntry,
  FinanceReportPayloadWithExportRows,
  FinanceReportType,
} from '@/lib/finance/reporting';
import type {
  CreateTransactionData,
  UpdateTransactionData,
} from '@/lib/validations/finance';

// Types
export interface FinancialTransactionUser {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface FinancialTransaction {
  id: number;
  rowId?: string;
  transactionNumber: string;
  type: 'EXPENSE' | 'INCOME';
  amount: number;
  eventType: string;
  displayLabel: string;
  source: 'MANUAL' | 'POS' | 'STOCK';
  sourceId: number;
  sourceModel:
    | 'FinancialTransaction'
    | 'SalesTransaction'
    | 'StockAddition'
    | 'TransactionPayment'
    | 'SplitPayment';
  sourcePath?: string | null;
  description: string;
  transactionDate: string;
  date?: string;
  paymentMethod?: string | null;
  status: string;
  paymentState?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
  createdByName?: string;
  createdByUser?: FinancialTransactionUser;
  approvedBy?: number;
  approvedByName?: string;
  approvedByUser?: FinancialTransactionUser;
  approvedAt?: string;
  category: string;
  categoryLabel: string;
  cashIn: number;
  cashOut: number;
  profitIn?: number;
  profitOut?: number;
  inventoryValueIn?: number;
  inventoryValueOut?: number;
  receivableIncrease: number;
  receivableDecrease: number;
  netCashImpact: number;
  netProfitImpact?: number;
  netInventoryImpact?: number;
  netReceivableImpact: number;
  editable: boolean;
  estimated?: boolean;
  estimatedReason?: string | null;
  customerName?: string | null;
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
  search?: string;
  type?: string;
  status?: string;
  paymentMethod?: string;
  source?: string;
  eventType?: string;
  cashImpact?: 'in' | 'out' | 'none' | 'all';
  profitImpact?: 'in' | 'out' | 'none' | 'all';
  paymentState?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FinancialTransactionPagination {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
  totalItems?: number;
}

export interface FinancialTransactionListResponse {
  data: FinancialTransaction[];
  pagination: FinancialTransactionPagination;
}

export interface FinancialReportsResponse {
  data: FinanceReportPayloadWithExportRows;
  message?: string;
  success: boolean;
}

export interface GeneratedFinancialReportResponse {
  report: FinanceReportPayloadWithExportRows;
  snapshot?: {
    id: number;
    reportType: string;
    reportName: string;
    generatedAt: string;
    methodologyStatus: 'exact' | 'estimated';
  };
}

export interface FinancialReportSnapshotDetail extends FinanceReportHistoryEntry {
  reportData: FinanceReportPayloadWithExportRows;
}

export type FinancialReportSnapshotSummary = FinanceReportHistoryEntry;

export interface FinancialReportComparisonMetric {
  base: number;
  comparison: number;
  delta: number;
  percentageChange: number;
}

export interface FinancialReportComparisonResponse {
  base: FinancialReportSnapshotSummary;
  comparison: FinancialReportSnapshotSummary;
  deltas: {
    summary: Record<string, FinancialReportComparisonMetric>;
    trading: Record<string, FinancialReportComparisonMetric>;
    cashMovement: Record<string, FinancialReportComparisonMetric>;
    businessPosition: Record<string, FinancialReportComparisonMetric>;
  };
}

type ApiErrorPayload = {
  error?: string;
  message?: string;
};

async function getApiErrorMessage(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  const errorPayload = (await response.json().catch(() => ({}))) as ApiErrorPayload;
  return errorPayload.error || errorPayload.message || fallbackMessage;
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
  if (filters.source && filters.source !== 'all')
    searchParams.set('source', filters.source);
  if (filters.eventType && filters.eventType !== 'all')
    searchParams.set('eventType', filters.eventType);
  if (filters.cashImpact && filters.cashImpact !== 'all')
    searchParams.set('cashImpact', filters.cashImpact);
  if (filters.profitImpact && filters.profitImpact !== 'all')
    searchParams.set('profitImpact', filters.profitImpact);
  if (filters.paymentState && filters.paymentState !== 'all')
    searchParams.set('paymentState', filters.paymentState);
  if (filters.date && filters.date !== 'all')
    searchParams.set('date', filters.date);
  if (filters.startDate) searchParams.set('startDate', filters.startDate);
  if (filters.endDate) searchParams.set('endDate', filters.endDate);

  const response = await fetch(
    `/api/finance/transactions?${searchParams.toString()}`
  );
  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(
        response,
        `Failed to fetch financial transactions: ${response.status} ${response.statusText}`
      )
    );
  }
  const result = await response.json();
  return {
    data: result.data || [],
    pagination: result.pagination || {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      totalPages: 1,
      total: 0,
    },
  };
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
  return useQuery<FinancialReportsResponse>({
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
          errorData.error ||
            errorData.message ||
            'Failed to fetch financial reports'
        );
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useFinancialReportHistory(limit: number = 20) {
  return useQuery<{ success: boolean; data: FinanceReportHistoryEntry[] }>({
    queryKey: ['financial-report-history', limit],
    queryFn: async () => {
      const response = await fetch(`/api/finance/reports/history?limit=${limit}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            errorData.message ||
            'Failed to fetch financial report history'
        );
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useFinancialReportComparison(
  baseId?: number,
  comparisonId?: number
) {
  return useQuery<{
    success: boolean;
    data: FinancialReportComparisonResponse;
  }>({
    queryKey: ['financial-report-comparison', baseId, comparisonId],
    queryFn: async () => {
      if (!baseId || !comparisonId || baseId === comparisonId) {
        throw new Error('Choose two different report snapshots to compare');
      }

      const response = await fetch(
        `/api/finance/reports/compare?baseId=${baseId}&comparisonId=${comparisonId}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            errorData.message ||
            'Failed to compare financial reports'
        );
      }

      return response.json();
    },
    enabled: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useGenerateFinancialReport() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; data: GeneratedFinancialReportResponse },
    Error,
    {
      reportType: FinanceReportType;
      period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
      type?: 'all' | 'income' | 'expense';
      paymentMethod?: string;
      dateFrom?: string;
      dateTo?: string;
      saveSnapshot?: boolean;
    }
  >({
    mutationFn: async payload => {
      const response = await fetch('/api/finance/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            errorData.message ||
            'Failed to generate financial report'
        );
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['financial-reports'],
      });

      if (variables.saveSnapshot) {
        queryClient.invalidateQueries({
          queryKey: ['financial-report-history'],
        });
      }
    },
  });
}

// Mutation hooks
export function useCreateFinancialTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTransactionData) => {
      const response = await fetch('/api/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(
            response,
            `Failed to create financial transaction: ${response.statusText}`
          )
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
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<UpdateTransactionData>;
    }) => {
      const response = await fetch(`/api/finance/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          ...data,
        }),
      });
      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(
            response,
            `Failed to update financial transaction: ${response.statusText}`
          )
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
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await fetch(`/api/finance/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          (result as { error?: string }).error ||
            'Failed to delete financial transaction'
        );
      }
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
      queryClient.invalidateQueries({
        queryKey: ['financial-transactions'],
      });
      queryClient.invalidateQueries({
        queryKey: ['income', String(id)],
      });
      queryClient.invalidateQueries({
        queryKey: ['expense', String(id)],
      });
    },
  });
}
