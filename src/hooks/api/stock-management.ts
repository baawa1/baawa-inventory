/**
 * Stock Management API Hooks using TanStack Query
 * Provides hooks for stock reconciliations and related operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import type { CreateStockReconciliationData } from '@/lib/validations/stock-management';

// Types
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface StockReconciliation {
  id: number;
  title: string;
  description?: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  createdBy: User;
  approvedBy?: User;
  items: StockReconciliationItem[];
}

export interface StockReconciliationItem {
  id: number;
  systemCount: number;
  physicalCount: number;
  discrepancy: number;
  discrepancyReason?: string;
  estimatedImpact?: number;
  notes?: string;
  verified: boolean;
  product: {
    id: number;
    name: string;
    sku: string;
    stock: number;
  };
}

export interface InventorySnapshotRequest {
  categoryIds?: number[];
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
  includeZero?: boolean;
  limit?: number;
  cursor?: number;
}

export interface InventorySnapshotItem {
  id: number;
  name: string;
  sku: string;
  systemCount: number;
  physicalCount: number;
  cost: number;
  minStock: number;
  category: {
    id: number;
    name: string;
  } | null;
}

export interface InventorySnapshotResponse {
  data: InventorySnapshotItem[];
  pagination: {
    limit: number;
    nextCursor: number | null;
  };
}

export interface StockReconciliationFilters {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// API Functions
const fetchStockReconciliations = async (
  filters: Partial<StockReconciliationFilters> = {}
) => {
  const searchParams = new URLSearchParams({
    page: filters.page?.toString() || '1',
    limit: filters.limit?.toString() || '10',
    sortBy: filters.sortBy || 'createdAt',
    sortOrder: filters.sortOrder || 'desc',
  });

  if (filters.search) searchParams.set('search', filters.search);
  if (filters.status) searchParams.set('status', filters.status);

  const response = await fetch(
    `/api/stock-reconciliations?${searchParams.toString()}`
  );
  if (!response.ok) {
    throw new Error(
      `Failed to fetch stock reconciliations: ${response.statusText}`
    );
  }
  return response.json();
};

const fetchStockReconciliation = async (id: string) => {
  const response = await fetch(`/api/stock-reconciliations/${id}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch stock reconciliation: ${response.statusText}`
    );
  }
  return response.json();
};

const createStockReconciliation = async (
  data: CreateStockReconciliationData
) => {
  const response = await fetch('/api/stock-reconciliations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to create stock reconciliation: ${response.statusText}`
    );
  }
  return response.json();
};

const updateStockReconciliation = async ({
  id,
  ...data
}: { id: string } & Partial<StockReconciliation>) => {
  const response = await fetch(`/api/stock-reconciliations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to update stock reconciliation: ${response.statusText}`
    );
  }
  return response.json();
};

const submitStockReconciliation = async (id: number) => {
  const response = await fetch(`/api/stock-reconciliations/${id}/submit`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(
      `Failed to submit stock reconciliation: ${response.statusText}`
    );
  }
  return response.json();
};

const approveStockReconciliation = async (params: {
  id: number;
  notes?: string;
}) => {
  const response = await fetch(
    `/api/stock-reconciliations/${params.id}/approve`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: params.notes }),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to approve stock reconciliation: ${response.statusText}`
    );
  }
  return response.json();
};

const rejectStockReconciliation = async (params: {
  id: number;
  reason: string;
}) => {
  const response = await fetch(
    `/api/stock-reconciliations/${params.id}/reject`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: params.reason }),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to reject stock reconciliation: ${response.statusText}`
    );
  }
  return response.json();
};

const deleteStockReconciliation = async (id: string) => {
  const response = await fetch(`/api/stock-reconciliations/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(
      `Failed to delete stock reconciliation: ${response.statusText}`
    );
  }
  return response.json();
};

const fetchInventorySnapshot = async (
  filters: Partial<InventorySnapshotRequest> = {}
): Promise<InventorySnapshotResponse> => {
  const searchParams = new URLSearchParams();

  if (filters.categoryIds && filters.categoryIds.length > 0) {
    searchParams.set('categoryIds', filters.categoryIds.join(','));
  }

  if (filters.status) {
    searchParams.set('status', filters.status);
  }

  if (filters.includeZero !== undefined) {
    searchParams.set('includeZero', String(filters.includeZero));
  }

  if (filters.limit) {
    searchParams.set('limit', String(filters.limit));
  }

  if (filters.cursor) {
    searchParams.set('cursor', String(filters.cursor));
  }

  const response = await fetch(
    `/api/inventory/snapshot?${searchParams.toString()}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load inventory snapshot: ${response.statusText}`
    );
  }

  return response.json();
};

// Query Hooks
export const useStockReconciliations = (
  filters: Partial<StockReconciliationFilters> = {}
) => {
  return useQuery({
    queryKey: queryKeys.inventory.stockReconciliations.list(filters),
    queryFn: () => fetchStockReconciliations(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useStockReconciliation = (id: string) => {
  return useQuery({
    queryKey: queryKeys.inventory.stockReconciliations.detail(id),
    queryFn: () => fetchStockReconciliation(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutation Hooks
export const useCreateStockReconciliation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStockReconciliation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.stockReconciliations.all(),
      });
    },
  });
};

export const useUpdateStockReconciliation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStockReconciliation,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.stockReconciliations.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.stockReconciliations.detail(variables.id),
      });
    },
  });
};

export const useSubmitStockReconciliation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitStockReconciliation,
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.stockReconciliations.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.stockReconciliations.detail(
          id.toString()
        ),
      });
    },
  });
};

export const useApproveStockReconciliation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveStockReconciliation,
    onSuccess: (data, params) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.stockReconciliations.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.stockReconciliations.detail(
          params.id.toString()
        ),
      });
    },
  });
};

export const useRejectStockReconciliation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectStockReconciliation,
    onSuccess: (data, params) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.stockReconciliations.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.stockReconciliations.detail(
          params.id.toString()
        ),
      });
    },
  });
};

export const useDeleteStockReconciliation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStockReconciliation,
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.stockReconciliations.all(),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.inventory.stockReconciliations.detail(id),
      });
    },
  });
};

export const useInventorySnapshot = (
  filters: Partial<InventorySnapshotRequest> = {}
) => {
  return useQuery({
    queryKey: queryKeys.inventory.stockSnapshot(filters),
    queryFn: () => fetchInventorySnapshot(filters),
    enabled: Boolean(filters.categoryIds && filters.categoryIds.length > 0),
    staleTime: 5 * 60 * 1000,
  });
};
