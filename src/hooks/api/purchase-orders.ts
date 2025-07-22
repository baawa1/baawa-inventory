import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";

// Types
export interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplierId: number;
  userId: number;
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  subtotal: string;
  taxAmount: string;
  shippingCost?: string;
  totalAmount: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  suppliers?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
  };
  users?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  purchaseOrderItems?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: number;
  purchaseOrderId: number;
  productId?: number;
  variantId?: number;
  quantityOrdered: number;
  quantityReceived?: number;
  unitCost: string;
  totalCost: string;
  products?: {
    id: number;
    name: string;
    sku: string;
  };
  productVariants?: {
    id: number;
    name: string;
    sku: string;
  };
}

export interface PurchaseOrderFilters {
  search?: string;
  status?: string;
  supplierId?: number;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PurchaseOrderPagination {
  page: number;
  limit: number;
  totalPages: number;
  totalCount: number;
}

export interface PurchaseOrderResponse {
  data: PurchaseOrder[];
  totalCount: number;
  page: number;
  limit: number;
}

export interface CreatePurchaseOrderData {
  supplierId: number;
  orderDate: string;
  expectedDeliveryDate?: string;
  subtotal: number;
  taxAmount: number;
  shippingCost?: number;
  totalAmount: number;
  notes?: string;
  items: Array<{
    productId?: number;
    variantId?: number;
    quantityOrdered: number;
    unitCost: number;
    totalCost: number;
  }>;
}

export interface UpdatePurchaseOrderData
  extends Partial<CreatePurchaseOrderData> {
  status?: string;
  actualDeliveryDate?: string;
}

// API Functions
const fetchPurchaseOrders = async (
  filters: Partial<PurchaseOrderFilters> = {}
): Promise<PurchaseOrderResponse> => {
  const searchParams = new URLSearchParams({
    page: String(filters.page || 1),
    limit: String(filters.limit || 10),
    sortBy: filters.sortBy || "orderDate",
    sortOrder: filters.sortOrder || "desc",
  });

  if (filters.search) searchParams.set("search", filters.search);
  if (filters.status) searchParams.set("status", filters.status);
  if (filters.supplierId)
    searchParams.set("supplierId", String(filters.supplierId));
  if (filters.fromDate) searchParams.set("fromDate", filters.fromDate);
  if (filters.toDate) searchParams.set("toDate", filters.toDate);

  const response = await fetch(
    `/api/purchase-orders?${searchParams.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch purchase orders: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    data: data.data || [],
    totalCount: data.pagination?.total || 0,
    page: data.pagination?.page || 1,
    limit: data.pagination?.limit || 10,
  };
};

const createPurchaseOrder = async (
  data: CreatePurchaseOrderData
): Promise<PurchaseOrder> => {
  const response = await fetch("/api/purchase-orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create purchase order");
  }

  return response.json();
};

const updatePurchaseOrder = async ({
  id,
  data,
}: {
  id: number;
  data: UpdatePurchaseOrderData;
}): Promise<PurchaseOrder> => {
  const response = await fetch(`/api/purchase-orders/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update purchase order");
  }

  return response.json();
};

const deletePurchaseOrder = async (id: number): Promise<void> => {
  const response = await fetch(`/api/purchase-orders/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete purchase order");
  }
};

// Hooks
export const usePurchaseOrders = (
  filters: Partial<PurchaseOrderFilters> = {}
) => {
  return useQuery({
    queryKey: [...queryKeys.purchaseOrders.all, filters],
    queryFn: () => fetchPurchaseOrders(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePurchaseOrder = (id: number) => {
  return useQuery({
    queryKey: queryKeys.purchaseOrders.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/purchase-orders/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch purchase order");
      }
      return response.json();
    },
    enabled: !!id,
  });
};

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
    },
  });
};

export const useUpdatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePurchaseOrder,
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.purchaseOrders.detail(id),
      });
    },
  });
};

export const useDeletePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
    },
  });
};
