"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";

interface Product {
  id: number;
  name: string;
  sku: string;
  stock: number;
  category: string;
}

// Hook to fetch products for stock adjustment
export function useStockAdjustmentProducts() {
  return useQuery({
    queryKey: [...queryKeys.products.all, "stock-adjustment"] as const,
    queryFn: async (): Promise<Product[]> => {
      const response = await fetch("/api/products?status=active");
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const result = await response.json();
      return (result.data || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        stock: product.stock,
        category: product.category?.name || "No Category",
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to find a specific product by ID
export function useProductForAdjustment(productId: string | null) {
  const { data: products = [], isLoading } = useStockAdjustmentProducts();

  const selectedProduct = productId
    ? products.find((p) => p.id.toString() === productId) || null
    : null;

  return {
    selectedProduct,
    products,
    isLoading,
  };
}
