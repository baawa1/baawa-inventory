import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';

// Types
export interface Category {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  parentId?: number;
  parent?: {
    id: number;
    name: string;
  };
  children?: Category[];
  productCount: number;
  subcategoryCount: number;
  createdAt: string;
  updatedAt: string;
  wordpress_id?: number | null;
}

export interface CategoryFilters {
  search?: string;
  status?: string;
  parentId?: number | null | string;
  includeChildren?: boolean;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
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
  isActive?: boolean;
  parentId?: number;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  isActive?: boolean;
}

// API Functions
const fetchCategories = async (
  filters: Partial<CategoryFilters> = {}
): Promise<CategoryResponse> => {
  const searchParams = new URLSearchParams({
    page: String(filters.page || 1),
    limit: String(filters.limit || 50),
    sortBy: filters.sortBy || 'name',
    sortOrder: filters.sortOrder || 'asc',
  });

  if (filters.search) searchParams.set('search', filters.search);
  if (filters.status) searchParams.set('isActive', filters.status);
  if (filters.parentId !== undefined)
    searchParams.set('parentId', String(filters.parentId));
  if (filters.includeChildren) searchParams.set('includeChildren', 'true');

  const response = await fetch(`/api/categories?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    data: data.data || [],
    pagination: {
      page: data.pagination?.page || 1,
      limit: data.pagination?.limit || 50,
      totalPages: data.pagination?.totalPages || 1,
      totalCategories: data.pagination?.total || 0,
    },
  };
};

const createCategory = async (data: CreateCategoryData): Promise<Category> => {
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
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
    method: 'DELETE',
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
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get top-level categories only
export const useTopLevelCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories.list({ parentId: null }),
    queryFn: () => fetchCategories({ parentId: null }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get subcategories for a specific parent
export const useSubcategories = (parentId: number) => {
  return useQuery({
    queryKey: queryKeys.categories.list({ parentId }),
    queryFn: () => fetchCategories({ parentId }),
    enabled: !!parentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get all categories with hierarchy for product forms
export const useCategoriesWithHierarchy = () => {
  return useQuery({
    queryKey: queryKeys.categories.list({ includeChildren: true }),
    queryFn: () => fetchCategories({ includeChildren: true }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutation Hooks
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: data => {
      // Invalidate all category-related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.categories.lists(),
        exact: false,
      });
      // Also invalidate specific list queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.categories.lists(),
        exact: false,
      });
      // Update individual category detail
      queryClient.setQueryData(queryKeys.categories.detail(data.id), data);
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCategory,
    onSuccess: data => {
      // Invalidate all category-related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.categories.lists(),
        exact: false,
      });
      // Also invalidate specific list queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.categories.lists(),
        exact: false,
      });
      // Update individual category detail
      queryClient.setQueryData(queryKeys.categories.detail(data.id), data);
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      // Invalidate all category-related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.categories.lists(),
        exact: false,
      });
      // Also invalidate specific list queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.categories.lists(),
        exact: false,
      });
    },
  });
};

// Utility Hooks
export const useCategoryOptions = () => {
  return useQuery({
    queryKey: [...queryKeys.categories.all, 'options'] as const,
    queryFn: async () => {
      const response = await fetch('/api/categories?isActive=true&limit=1000');
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
