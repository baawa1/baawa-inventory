import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface FinancialCategory {
  id: number;
  name: string;
  type: "INCOME" | "EXPENSE";
  description: string | null;
  color: string | null;
  icon: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateCategoryData {
  name: string;
  type: "INCOME" | "EXPENSE";
  description?: string;
  color?: string;
  icon?: string;
}

interface UpdateCategoryData extends Partial<CreateCategoryData> {
  id: number;
}

// Fetch financial categories
export const useFinancialCategories = () => {
  return useQuery({
    queryKey: ["financial-categories"],
    queryFn: async (): Promise<FinancialCategory[]> => {
      const response = await fetch("/api/finance/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch financial categories");
      }
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create financial category
export const useCreateFinancialCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateCategoryData
    ): Promise<FinancialCategory> => {
      const response = await fetch("/api/finance/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create category");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-categories"] });
      toast.success("Category created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Update financial category
export const useUpdateFinancialCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: UpdateCategoryData
    ): Promise<FinancialCategory> => {
      const response = await fetch(`/api/finance/categories/${data.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update category");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-categories"] });
      toast.success("Category updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Delete financial category
export const useDeleteFinancialCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const response = await fetch(`/api/finance/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete category");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-categories"] });
      toast.success("Category deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
