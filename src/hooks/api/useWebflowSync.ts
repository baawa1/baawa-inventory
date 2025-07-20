import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Types for Webflow sync data
export interface WebflowSyncRecord {
  id: number;
  entity_type: string;
  entity_id: number;
  webflow_item_id: string | null;
  sync_status: "pending" | "synced" | "failed" | "error" | "archived";
  last_sync_at: string | null;
  sync_errors: string | null;
  retry_count: number;
  next_retry_at: string | null;
  is_published: boolean;
  auto_sync: boolean;
  webflow_url: string | null;
}

export interface ProductWithSync {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  showInWebflow: boolean;
  status: string;
  category: { id: number; name: string } | null;
  brand: { id: number; name: string } | null;
  images: any[];
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  // onlinePrice: number | null; // Not implemented yet
  // onlinePriceFormula: string | null; // Not implemented yet
  createdAt: string;
  updatedAt: string;
  webflowSync: WebflowSyncRecord | null;
}

export interface WebflowSyncFilters {
  search: string;
  syncStatus: string;
  autoSync: string;
  showInWebflow: string;
  category: string;
  brand: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface WebflowSyncPagination {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}

export interface WebflowSyncResponse {
  data: ProductWithSync[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalProducts: number;
    syncedProducts: number;
    pendingProducts: number;
    failedProducts: number;
    notSyncedProducts: number;
  };
}

// API functions
async function fetchProductsWithSync(
  filters: Partial<WebflowSyncFilters>,
  pagination: { page: number; limit: number }
): Promise<WebflowSyncResponse> {
  const params = new URLSearchParams({
    page: pagination.page.toString(),
    limit: pagination.limit.toString(),
    includeSync: "true",
    ...Object.entries(filters).reduce(
      (acc, [key, value]) => {
        if (value && value !== "") {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, string>
    ),
  });

  const response = await fetch(`/api/products?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch products with sync status");
  }
  return response.json();
}

async function syncIndividualProduct(productId: number, forceSync = false) {
  const response = await fetch(`/api/webflow/sync/products/${productId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ forceSync }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to sync product");
  }

  return response.json();
}

async function bulkSyncProducts(productIds: number[]) {
  const response = await fetch("/api/webflow/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "bulk-sync",
      entityType: "products",
      entityIds: productIds,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to bulk sync products");
  }

  return response.json();
}

async function syncAllProducts() {
  const response = await fetch("/api/webflow/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "bulk-sync",
      entityType: "products",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to sync all products");
  }

  return response.json();
}

// Hooks
export function useProductsWithSync(
  filters: Partial<WebflowSyncFilters>,
  pagination: { page: number; limit: number }
) {
  return useQuery({
    queryKey: ["products-with-sync", filters, pagination],
    queryFn: () => fetchProductsWithSync(filters, pagination),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

export function useSyncProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      forceSync,
    }: {
      productId: number;
      forceSync?: boolean;
    }) => syncIndividualProduct(productId, forceSync),
    onSuccess: () => {
      toast.success("Product synced successfully");
      queryClient.invalidateQueries({ queryKey: ["products-with-sync"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useBulkSyncProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkSyncProducts,
    onSuccess: (data) => {
      toast.success(
        `Bulk sync completed: ${data.result?.successful || 0} successful, ${data.result?.failed || 0} failed`
      );
      queryClient.invalidateQueries({ queryKey: ["products-with-sync"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useSyncAllProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncAllProducts,
    onSuccess: (data) => {
      toast.success(
        `Sync all completed: ${data.summary?.successfulProducts || 0} successful, ${data.summary?.failedProducts || 0} failed`
      );
      queryClient.invalidateQueries({ queryKey: ["products-with-sync"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
