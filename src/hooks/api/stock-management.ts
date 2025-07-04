/**
 * Stock Management API Hooks using TanStack Query
 * Provides hooks for stock adjustments, reconciliations, and related operations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";

// Types
export interface StockAdjustment {
  id: string;
  productId: string;
  quantity: number;
  reason: string;
  type: "INCREASE" | "DECREASE";
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    category: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

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

export interface StockAdjustmentFilters {
  search?: string;
  type?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
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
const fetchStockAdjustments = async (
  filters: Partial<StockAdjustmentFilters> = {}
) => {
  const searchParams = new URLSearchParams({
    page: filters.page?.toString() || "1",
    limit: filters.limit?.toString() || "10",
    sortBy: filters.sortBy || "createdAt",
    sortOrder: filters.sortOrder || "desc",
  });

  if (filters.search) searchParams.set("search", filters.search);
  if (filters.type) searchParams.set("type", filters.type);
  if (filters.status) searchParams.set("status", filters.status);
  if (filters.fromDate) searchParams.set("fromDate", filters.fromDate);
  if (filters.toDate) searchParams.set("toDate", filters.toDate);

  const response = await fetch(
    `/api/stock-adjustments?${searchParams.toString()}`
  );
  if (!response.ok) {
    throw new Error(
      `Failed to fetch stock adjustments: ${response.statusText}`
    );
  }
  return response.json();
};

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

const fetchStockReconciliation = async (id: number) => {
  const response = await fetch(`/api/stock-reconciliations/${id}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch stock reconciliation: ${response.statusText}`
    );
  }
  return response.json();
};

const fetchStockAdjustment = async (id: string) => {
  const response = await fetch(`/api/stock-adjustments/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch stock adjustment: ${response.statusText}`);
  }
  return response.json();
};

const createStockAdjustment = async (data: Partial<StockAdjustment>) => {
  const response = await fetch("/api/stock-adjustments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to create stock adjustment: ${response.statusText}`
    );
  }
  return response.json();
};

const updateStockAdjustment = async ({
  id,
  ...data
}: { id: string } & Partial<StockAdjustment>) => {
  const response = await fetch(`/api/stock-adjustments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to update stock adjustment: ${response.statusText}`
    );
  }
  return response.json();
};

const approveStockAdjustment = async (id: string) => {
  const response = await fetch(`/api/stock-adjustments/${id}/approve`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(
      `Failed to approve stock adjustment: ${response.statusText}`
    );
  }
  return response.json();
};

const rejectStockAdjustment = async (params: {
  id: string;
  rejectionReason?: string;
}) => {
  const response = await fetch(`/api/stock-adjustments/${params.id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rejectionReason: params.rejectionReason }),
  });
  if (!response.ok) {
    throw new Error(
      `Failed to reject stock adjustment: ${response.statusText}`
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

const submitStockReconciliation = async (id: number) => {
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

const approveStockReconciliation = async (params: {
  id: number;
  notes?: string;
}) => {
  const response = await fetch(
    `/api/stock-reconciliations/${params.id}/approve`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
export const useStockAdjustments = (
  filters: Partial<StockAdjustmentFilters> = {}
) => {
  return useQuery({
    queryKey: queryKeys.inventory.stockAdjustments.list(filters),
    queryFn: () => fetchStockAdjustments(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useStockAdjustment = (id: string) => {
  return useQuery({
    queryKey: ["stock-adjustments", id],
    queryFn: () => fetchStockAdjustment(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useStockReconciliations = (
  filters: Partial<StockReconciliationFilters> = {}
) => {
  return useQuery({
    queryKey: queryKeys.inventory.stockReconciliation.list(filters),
    queryFn: () => fetchStockReconciliations(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useStockReconciliation = (id: number) => {
  return useQuery({
    queryKey: ["stock-reconciliations", id],
    queryFn: () => fetchStockReconciliation(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutation Hooks
export const useCreateStockAdjustment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStockAdjustment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.stockAdjustments.all(),
      });
    },
  });
};

export const useUpdateStockAdjustment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStockAdjustment,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.stockAdjustments.all(),
      });
      queryClient.invalidateQueries({
        queryKey: ["stock-adjustments", variables.id],
      });
    },
  });
};

export const useApproveStockAdjustment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveStockAdjustment,
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.stockAdjustments.all(),
      });
      queryClient.invalidateQueries({ queryKey: ["stock-adjustments", id] });
    },
  });
};

export const useRejectStockAdjustment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectStockAdjustment,
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.stockAdjustments.all(),
      });
      queryClient.invalidateQueries({ queryKey: ["stock-adjustments", id] });
    },
  });
};

export const useCreateStockReconciliation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStockReconciliation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.stockReconciliation.all(),
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
        queryKey: queryKeys.inventory.stockReconciliation.all(),
      });
      queryClient.invalidateQueries({
        queryKey: ["stock-reconciliations", variables.id],
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
        queryKey: queryKeys.inventory.stockReconciliation.all(),
      });
      queryClient.invalidateQueries({
        queryKey: ["stock-reconciliations", id],
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
        queryKey: queryKeys.inventory.stockReconciliation.all(),
      });
      queryClient.invalidateQueries({
        queryKey: ["stock-reconciliations", params.id],
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
        queryKey: queryKeys.inventory.stockReconciliation.all(),
      });
      queryClient.invalidateQueries({
        queryKey: ["stock-reconciliations", params.id],
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
        queryKey: queryKeys.inventory.stockReconciliation.all(),
      });
      queryClient.invalidateQueries({
        queryKey: ["stock-reconciliations", id],
      });
    },
  });
};
