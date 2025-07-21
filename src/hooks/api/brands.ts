import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";

// Types
export interface Brand {
  id: number;
  name: string;
  description?: string;
  image?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandFilters {
  search: string;
  status: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  page: number;
  limit: number;
}

export interface BrandPagination {
  page: number;
  limit: number;
  totalPages: number;
  totalBrands: number;
}

export interface BrandResponse {
  data: Brand[];
  pagination: BrandPagination;
}

export interface CreateBrandData {
  name: string;
  description?: string;
  image?: string;
  website?: string;
}

export interface UpdateBrandData extends Partial<CreateBrandData> {
  isActive?: boolean;
}

// API Functions
const fetchBrands = async (
  filters: Partial<BrandFilters> = {}
): Promise<BrandResponse> => {
  const searchParams = new URLSearchParams({
    page: String(filters.page || 1),
    limit: String(filters.limit || 50),
    sortBy: filters.sortBy || "name",
    sortOrder: filters.sortOrder || "asc",
  });

  if (filters.search) searchParams.set("search", filters.search);
  if (filters.status) searchParams.set("isActive", filters.status);

  const response = await fetch(`/api/brands?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch brands: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    data: data.data || [],
    pagination: {
      page: data.pagination?.page || 1,
      limit: data.pagination?.limit || 50,
      totalPages: data.pagination?.totalPages || 1,
      totalBrands: data.pagination?.total || 0,
    },
  };
};

const createBrand = async (data: CreateBrandData): Promise<Brand> => {
  const response = await fetch("/api/brands", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create brand: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
};

const updateBrand = async ({
  id,
  data,
}: {
  id: number;
  data: UpdateBrandData;
}): Promise<Brand> => {
  const response = await fetch(`/api/brands/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update brand: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
};

const deleteBrand = async (id: number): Promise<void> => {
  const response = await fetch(`/api/brands/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete brand: ${response.statusText}`);
  }
};

// Query Hooks
export const useBrands = (filters: Partial<BrandFilters> = {}) => {
  return useQuery({
    queryKey: queryKeys.brands.list(filters),
    queryFn: () => fetchBrands(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useBrand = (id: number) => {
  return useQuery({
    queryKey: queryKeys.brands.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/brands/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch brand: ${response.statusText}`);
      }
      const result = await response.json();
      return result.data;
    },
    enabled: !!id,
  });
};

// Alias for backward compatibility
export const useBrandById = useBrand;

// Mutation Hooks
export const useCreateBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBrand,
    onSuccess: () => {
      // Invalidate all brand-related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.brands.all,
        exact: false,
      });
      // Also invalidate specific list queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.brands.lists(),
        exact: false,
      });
    },
  });
};

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBrand,
    onSuccess: (data) => {
      // Invalidate all brand-related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.brands.all,
        exact: false,
      });
      // Also invalidate specific list queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.brands.lists(),
        exact: false,
      });
      // Update individual brand detail
      queryClient.setQueryData(queryKeys.brands.detail(data.id), data);
    },
  });
};

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBrand,
    onSuccess: () => {
      // Invalidate all brand-related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.brands.all,
        exact: false,
      });
      // Also invalidate specific list queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.brands.lists(),
        exact: false,
      });
    },
  });
};

// Utility Hooks
export const useBrandOptions = () => {
  return useQuery({
    queryKey: [...queryKeys.brands.all, "options"] as const,
    queryFn: async () => {
      const response = await fetch("/api/brands?isActive=true&limit=1000");
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
