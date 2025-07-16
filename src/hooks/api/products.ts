import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";

// Types
export interface Product {
  id: number;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category?: {
    id: number;
    name: string;
  };
  brand?: {
    id: number;
    name: string;
  };
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  weight?: number;
  dimensions?: string;
  color?: string;
  size?: string;
  material?: string;
  hasVariants: boolean;
  isArchived: boolean;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  seoKeywords: string[];
  status: "active" | "inactive";
  allowReviews: boolean;
  isFeatured: boolean;
  metaContent?: string;
  metaExcerpt?: string;
  saleEndDate?: string;
  salePrice?: number;
  saleStartDate?: string;
  sortOrder?: number;
  variantAttributes?: any;
  variantValues?: any;
  supplier?: {
    id: number;
    name: string;
  };
  image?: string;
  images?: Array<{
    id: string;
    url: string;
    filename: string;
    size: number;
    mimeType: string;
    alt?: string;
    isPrimary: boolean;
    uploadedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  search: string;
  categoryId: string;
  brandId: string;
  status: string;
  supplier: string;
  lowStock: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface ProductPagination {
  page: number;
  limit: number;
  totalPages: number;
  totalProducts: number;
}

export interface ProductListResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Brand {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

// API Functions
const fetchProducts = async (
  filters: Partial<ProductFilters>,
  pagination: Partial<ProductPagination>
): Promise<ProductListResponse> => {
  const searchParams = new URLSearchParams({
    page: pagination.page?.toString() || "1",
    limit: pagination.limit?.toString() || "10",
    sortBy: filters.sortBy || "name",
    sortOrder: filters.sortOrder || "asc",
  });

  if (filters.search) searchParams.set("search", filters.search);
  if (filters.categoryId) searchParams.set("categoryId", filters.categoryId);
  if (filters.brandId) searchParams.set("brandId", filters.brandId);
  if (filters.status) searchParams.set("status", filters.status);
  if (filters.supplier) searchParams.set("supplierId", filters.supplier);
  if (filters.lowStock) searchParams.set("lowStock", "true");

  const response = await fetch(`/api/products?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch products: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
};

const fetchProductById = async (id: number): Promise<Product> => {
  const response = await fetch(`/api/products/${id}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch product: ${response.status} ${response.statusText}`
    );
  }
  const data = await response.json();
  return data.product || data.data || data;
};

const fetchBrands = async (
  filters: { isActive?: boolean; limit?: number } = {}
): Promise<Brand[]> => {
  const searchParams = new URLSearchParams();
  if (filters.isActive !== undefined)
    searchParams.set("isActive", filters.isActive.toString());
  if (filters.limit) searchParams.set("limit", filters.limit.toString());

  const response = await fetch(`/api/brands?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch brands: ${response.status} ${response.statusText}`
    );
  }
  const data = await response.json();
  return data.data || data.brands || data;
};

const fetchCategories = async (
  filters: { isActive?: boolean; limit?: number } = {}
): Promise<Category[]> => {
  const searchParams = new URLSearchParams();
  if (filters.isActive !== undefined)
    searchParams.set("isActive", filters.isActive.toString());
  if (filters.limit) searchParams.set("limit", filters.limit.toString());

  const response = await fetch(`/api/categories?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch categories: ${response.status} ${response.statusText}`
    );
  }
  const data = await response.json();
  return data.data || data.categories || data;
};

// Query Hooks
export function useProducts(
  filters: Partial<ProductFilters> = {},
  pagination: Partial<ProductPagination> = {}
) {
  return useQuery({
    queryKey: queryKeys.products.list({ filters, pagination }),
    queryFn: () => fetchProducts(filters, pagination),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while loading new page
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => fetchProductById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useBrands(
  filters: { isActive?: boolean; limit?: number } = {}
) {
  return useQuery({
    queryKey: queryKeys.brands.list(filters),
    queryFn: () => fetchBrands(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCategories(
  filters: { isActive?: boolean; limit?: number } = {}
) {
  return useQuery({
    queryKey: queryKeys.categories.list(filters),
    queryFn: () => fetchCategories(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Mutation Hooks
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      productData: Omit<Product, "id" | "createdAt" | "updatedAt">
    ) => {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      if (!response.ok) {
        throw new Error(
          `Failed to create product: ${response.status} ${response.statusText}`
        );
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.metrics(),
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...productData
    }: Partial<Product> & { id: number }) => {
      const response = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      if (!response.ok) {
        throw new Error(
          `Failed to update product: ${response.status} ${response.statusText}`
        );
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update the specific product in cache
      queryClient.setQueryData(queryKeys.products.detail(variables.id), data);
      // Invalidate products list to refetch updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.metrics(),
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(
          `Failed to delete product: ${response.status} ${response.statusText}`
        );
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.metrics(),
      });
    },
  });
}

// Utility Hooks
export const useProductOptions = () => {
  return useQuery({
    queryKey: [...queryKeys.products.all, "options"] as const,
    queryFn: async () => {
      const response = await fetch("/api/products?status=active");
      if (!response.ok) {
        throw new Error(
          `Failed to fetch product options: ${response.statusText}`
        );
      }
      const result = await response.json();
      return result.data.map((product: Product) => ({
        value: product.id.toString(),
        label: `${product.name} (${product.sku})`,
        sku: product.sku,
        stock: product.stock,
        category: product.category?.name || "No Category",
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for product options
  });
};
