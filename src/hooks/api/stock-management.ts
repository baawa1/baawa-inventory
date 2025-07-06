/**
 * Stock Management API Hooks using TanStack Query
 * Provides hooks for stock reconciliations and related operations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";

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
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
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
  product: {
    id: number;
    name: string;
    sku: string;
    stock: number;
  };
}

export interface StockReconciliationFilters {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// API Functions
const fetchStockReconciliations = async (
  filters: Partial<StockReconciliationFilters> = {}
) => {
  const searchParams = new URLSearchParams({
    page: filters.page?.toString() || "1",
    limit: filters.limit?.toString() || "10",
    sortBy: filters.sortBy || "createdAt",
    sortOrder: filters.sortOrder || "desc",
  });

  if (filters.search) searchParams.set("search", filters.search);
  if (filters.status) searchParams.set("status", filters.status);

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
  data: Partial<StockReconciliation>
) => {
  const response = await fetch("/api/stock-reconciliations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to update stock reconciliation: ${response.statusText}`
    );
  }
  return response.json();
};

const submitStockReconciliation = async (id: string) => {
  const response = await fetch(`/api/stock-reconciliations/${id}/submit`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(
      `Failed to submit stock reconciliation: ${response.statusText}`
    );
  }
  return response.json();
};

const approveStockReconciliation = async (id: string) => {
  const response = await fetch(`/api/stock-reconciliations/${id}/approve`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(
      `Failed to approve stock reconciliation: ${response.statusText}`
    );
  }
  return response.json();
};

const rejectStockReconciliation = async (params: {
  id: string;
  rejectionReason: string;
}) => {
  const response = await fetch(
    `/api/stock-reconciliations/${params.id}/reject`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rejectionReason: params.rejectionReason }),
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
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(
      `Failed to delete stock reconciliation: ${response.statusText}`
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
        queryKey: queryKeys.inventory.stockReconciliations.detail(id),
      });
    },
  });
};

export const useApproveStockReconciliation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveStockReconciliation,
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.stockReconciliations.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.stockReconciliations.detail(id),
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
        queryKey: queryKeys.inventory.stockReconciliations.detail(params.id),
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
