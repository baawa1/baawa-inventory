import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";

// Types
export interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierFilters {
  search: string;
  status: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface SupplierPagination {
  page: number;
  limit: number;
  totalPages: number;
  totalSuppliers: number;
}

export interface SupplierResponse {
  data: Supplier[];
  pagination: SupplierPagination;
}

export interface CreateSupplierData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
}

export interface UpdateSupplierData extends Partial<CreateSupplierData> {
  isActive?: boolean;
}

// API Functions
const fetchSuppliers = async (
  filters: Partial<SupplierFilters> = {}
): Promise<SupplierResponse> => {
  const searchParams = new URLSearchParams({
    page: "1",
    limit: "10",
    sortBy: filters.sortBy || "name",
    sortOrder: filters.sortOrder || "asc",
  });

  if (filters.search) searchParams.set("search", filters.search);
  if (filters.status) searchParams.set("status", filters.status);

  const response = await fetch(`/api/suppliers?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch suppliers: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    data: data.data || [],
    pagination: {
      page: data.pagination?.page || 1,
      limit: data.pagination?.limit || 10,
      totalPages: data.pagination?.totalPages || 1,
      totalSuppliers: data.pagination?.total || 0,
    },
  };
};

const createSupplier = async (data: CreateSupplierData): Promise<Supplier> => {
  const response = await fetch("/api/suppliers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create supplier: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
};

const updateSupplier = async ({
  id,
  data,
}: {
  id: number;
  data: UpdateSupplierData;
}): Promise<Supplier> => {
  const response = await fetch(`/api/suppliers/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update supplier: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
};

const deleteSupplier = async (id: number): Promise<void> => {
  const response = await fetch(`/api/suppliers/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete supplier: ${response.statusText}`);
  }
};

// Query Hooks
export const useSuppliers = (filters: Partial<SupplierFilters> = {}) => {
  return useQuery({
    queryKey: queryKeys.suppliers.list(filters),
    queryFn: () => fetchSuppliers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSupplier = (id: number) => {
  return useQuery({
    queryKey: queryKeys.suppliers.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/suppliers/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch supplier: ${response.statusText}`);
      }
      const result = await response.json();
      return result.data;
    },
    enabled: !!id,
  });
};

// Mutation Hooks
export const useCreateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
    },
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSupplier,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
      queryClient.setQueryData(queryKeys.suppliers.detail(data.id), data);
    },
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
    },
  });
};

// Utility Hooks
export const useSupplierOptions = () => {
  return useQuery({
    queryKey: [...queryKeys.suppliers.all, "options"] as const,
    queryFn: async () => {
      const response = await fetch("/api/suppliers?status=active");
      if (!response.ok) {
        throw new Error(
          `Failed to fetch supplier options: ${response.statusText}`
        );
      }
      const result = await response.json();
      return result.data.map((supplier: Supplier) => ({
        value: supplier.id.toString(),
        label: supplier.name,
      }));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes for options
  });
};
