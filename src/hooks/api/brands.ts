import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";

// Types for Brands
export interface Brand {
  id: number;
  name: string;
  description?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandFilters {
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface BrandListResponse {
  success: boolean;
  data: Brand[];
  pagination: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

// API Functions
const fetchBrands = async (
  filters: BrandFilters = {}
): Promise<BrandListResponse> => {
  const params = new URLSearchParams({
    page: String(filters.page || 1),
    limit: String(filters.limit || 10),
    sortBy: filters.sortBy || "name",
    sortOrder: filters.sortOrder || "asc",
  });

  if (filters.search) params.set("search", filters.search);
  if (filters.isActive !== undefined)
    params.set("isActive", filters.isActive.toString());

  const response = await fetch(`/api/brands?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch brands: ${response.statusText}`);
  }

  return response.json();
};

const deleteBrand = async (id: number): Promise<void> => {
  const response = await fetch(`/api/brands/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete brand: ${response.statusText}`);
  }
};

const createBrand = async (
  brandData: Omit<Brand, "id" | "createdAt" | "updatedAt">
): Promise<Brand> => {
  const response = await fetch("/api/brands", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(brandData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create brand: ${response.statusText}`);
  }

  return response.json();
};

const updateBrand = async ({
  id,
  ...brandData
}: Partial<Brand> & { id: number }): Promise<Brand> => {
  const response = await fetch(`/api/brands/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(brandData),
  });

  if (!response.ok) {
    throw new Error(`Failed to update brand: ${response.statusText}`);
  }

  return response.json();
};

// Query Hooks
export function useBrands(filters: BrandFilters = {}) {
  return useQuery({
    queryKey: queryKeys.brands.list(filters),
    queryFn: () => fetchBrands(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data, // Can transform data here if needed
  });
}

export function useBrandById(id: number) {
  return useQuery({
    queryKey: queryKeys.brands.detail(id),
    queryFn: () => fetch(`/api/brands/${id}`).then((res) => res.json()),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Mutation Hooks
export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBrand,
    onSuccess: () => {
      // Invalidate and refetch brands list
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.all });
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBrand,
    onSuccess: (data) => {
      // Update the specific brand in cache
      queryClient.setQueryData(queryKeys.brands.detail(data.id), data);
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.lists() });
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBrand,
    onSuccess: () => {
      // Invalidate all brand queries
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.all });
    },
  });
}

// Utility function for optimistic updates
export function useOptimisticBrandUpdate() {
  const queryClient = useQueryClient();

  return (brandId: number, updatedData: Partial<Brand>) => {
    queryClient.setQueryData(
      queryKeys.brands.detail(brandId),
      (oldData: Brand | undefined) =>
        oldData ? { ...oldData, ...updatedData } : undefined
    );
  };
}

// Utility Hooks
export const useBrandOptions = () => {
  return useQuery({
    queryKey: [...queryKeys.brands.all, "options"] as const,
    queryFn: async () => {
      const response = await fetch("/api/brands?isActive=true");
      if (!response.ok) {
        throw new Error(
          `Failed to fetch brand options: ${response.statusText}`
        );
      }
      const result = await response.json();
      return result.data.map((brand: Brand) => ({
        value: brand.id.toString(),
        label: brand.name,
      }));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes for options
  });
};
