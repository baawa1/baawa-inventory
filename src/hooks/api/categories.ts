import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";

// Types
export interface Category {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryFilters {
  search: string;
  status: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface CategoryPagination {
  page: number;
  limit: number;
  totalPages: number;
  totalCategories: number;
}

export interface CategoryResponse {
  data: Category[];
  pagination: CategoryPagination;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  isActive?: boolean;
}

// API Functions
const fetchCategories = async (
  filters: Partial<CategoryFilters> = {}
): Promise<CategoryResponse> => {
  const searchParams = new URLSearchParams({
    page: "1",
    limit: "10",
    sortBy: filters.sortBy || "name",
    sortOrder: filters.sortOrder || "asc",
  });

  if (filters.search) searchParams.set("search", filters.search);
  if (filters.status) searchParams.set("isActive", filters.status);

  const response = await fetch(`/api/categories?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    data: data.data || [],
    pagination: {
      page: data.pagination?.page || 1,
      limit: data.pagination?.limit || 10,
      totalPages: data.pagination?.totalPages || 1,
      totalCategories: data.pagination?.total || 0,
    },
  };
};

const createCategory = async (data: CreateCategoryData): Promise<Category> => {
  const response = await fetch("/api/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create category: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
};

const updateCategory = async ({
  id,
  data,
}: {
  id: number;
  data: UpdateCategoryData;
}): Promise<Category> => {
  const response = await fetch(`/api/categories/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update category: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
};

const deleteCategory = async (id: number): Promise<void> => {
  const response = await fetch(`/api/categories/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete category: ${response.statusText}`);
  }
};

// Query Hooks
export const useCategories = (filters: Partial<CategoryFilters> = {}) => {
  return useQuery({
    queryKey: queryKeys.categories.list(filters),
    queryFn: () => fetchCategories(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCategory = (id: number) => {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: async () => {
      const response = await fetch(`/api/categories/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch category: ${response.statusText}`);
      }
      const result = await response.json();
      return result.data;
    },
    enabled: !!id,
  });
};

// Mutation Hooks
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCategory,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.setQueryData(queryKeys.categories.detail(data.id), data);
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
};

// Utility Hooks
export const useCategoryOptions = () => {
  return useQuery({
    queryKey: [...queryKeys.categories.all, "options"] as const,
    queryFn: async () => {
      const response = await fetch("/api/categories?isActive=true");
      if (!response.ok) {
        throw new Error(
          `Failed to fetch category options: ${response.statusText}`
        );
      }
      const result = await response.json();
      return result.data.map((category: Category) => ({
        value: category.id.toString(),
        label: category.name,
      }));
    },
    staleTime: 10 * 60 * 1000, // 10 minutes for options
  });
};
