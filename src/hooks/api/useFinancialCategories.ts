import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ErrorHandlers } from "@/lib/utils/error-handling";

export interface FinancialCategory {
  id: number;
  name: string;
  type: "INCOME" | "EXPENSE";
  description: string | null;
  isActive: boolean;
  parentId: number | null;
  createdAt: Date;
  updatedAt: Date;
  parent?: FinancialCategory;
  children?: FinancialCategory[];
  _count?: {
    transactions: number;
  };
}

interface CategoryFilters {
  type?: string;
  isActive?: boolean;
}

export function useFinancialCategories(filters: CategoryFilters = {}) {
  const queryKey = ["financial-categories", filters];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<{ categories: FinancialCategory[] }> => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/finance/categories?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch financial categories");
      }
      return response.json();
    },
  });
}

export function useFinancialCategory(id: number) {
  return useQuery({
    queryKey: ["financial-category", id],
    queryFn: async (): Promise<{ category: FinancialCategory }> => {
      const response = await fetch(`/api/finance/categories/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch financial category");
      }
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateFinancialCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      categoryData: any
    ): Promise<{ category: FinancialCategory }> => {
      const response = await fetch("/api/finance/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create category");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-categories"] });
      toast.success("Category created successfully");
    },
    onError: ErrorHandlers.mutation,
  });
}

export function useUpdateFinancialCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: any;
    }): Promise<{ category: FinancialCategory }> => {
      const response = await fetch(`/api/finance/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update category");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["financial-categories"] });
      queryClient.invalidateQueries({
        queryKey: ["financial-category", variables.id],
      });
      toast.success("Category updated successfully");
    },
    onError: ErrorHandlers.mutation,
  });
}

export function useDeleteFinancialCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<{ message: string }> => {
      const response = await fetch(`/api/finance/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete category");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-categories"] });
      toast.success("Category deleted successfully");
    },
    onError: ErrorHandlers.mutation,
  });
}

// Helper hook to get categories by type
export function useExpenseCategories() {
  return useFinancialCategories({ type: "EXPENSE", isActive: true });
}

export function useIncomeCategories() {
  return useFinancialCategories({ type: "INCOME", isActive: true });
}

// Helper hook to get active categories for dropdowns
export function useActiveCategoriesForSelect(type?: "INCOME" | "EXPENSE") {
  const filters = type ? { type, isActive: true } : { isActive: true };
  const { data, ...rest } = useFinancialCategories(filters);

  const options =
    data?.categories?.map((category) => ({
      value: category.id.toString(),
      label: category.name,
      type: category.type,
    })) || [];

  return {
    ...rest,
    options,
    data,
  };
}
