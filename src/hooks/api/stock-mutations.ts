import { useMutation, useQueryClient } from "@tanstack/react-query";

// Add Stock Mutation
export function useAddStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      productId: number;
      quantity: number;
      costPerUnit: number;
      supplierId?: number;
      purchaseDate?: string;
      notes?: string;
      referenceNo?: string;
    }) => {
      const response = await fetch("/api/stock-additions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || errorData.message || "Failed to add stock"
        );
      }

      return response.json();
    },
    onSuccess: (_data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-additions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (error: Error) => {
      console.error("Error adding stock:", error);
    },
  });
}

// Update Stock Addition Mutation
export function useUpdateStockAddition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        quantity?: number;
        costPerUnit?: number;
        supplierId?: number;
        purchaseDate?: string;
        notes?: string;
        referenceNo?: string;
      };
    }) => {
      const response = await fetch(`/api/stock-additions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            errorData.message ||
            "Failed to update stock addition"
        );
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-additions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (error: Error) => {
      console.error("Error updating stock addition:", error);
    },
  });
}

// Delete Stock Addition Mutation
export function useDeleteStockAddition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/stock-additions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            errorData.message ||
            "Failed to delete stock addition"
        );
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-additions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (error: Error) => {
      console.error("Error deleting stock addition:", error);
    },
  });
}
