import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProductSchema } from "@/lib/validations/product";
import { useProduct } from "@/hooks/api/products";
import { useCategories } from "@/hooks/api/categories";
import { useBrands } from "@/hooks/api/brands";
import { useSuppliers } from "@/hooks/api/suppliers";
import type { z } from "zod";

type UpdateProductData = z.infer<typeof updateProductSchema>;

export interface UseEditProductFormResult {
  form: ReturnType<typeof useForm<UpdateProductData>>;
  product: any;
  categories: any[];
  brands: any[];
  suppliers: any[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook for edit product form that combines all necessary data queries
 * Uses TanStack Query for optimized data fetching with automatic caching and deduplication
 */
export function useEditProductForm(
  productId: number
): UseEditProductFormResult {
  const form = useForm<UpdateProductData>({
    resolver: zodResolver(updateProductSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      barcode: "",
      categoryId: undefined,
      brandId: undefined,
      supplierId: undefined,
      purchasePrice: 0,
      sellingPrice: 0,
      currentStock: 0,
      minimumStock: 0,
      maximumStock: undefined,
      status: "active",
      notes: "",
    },
  });

  // TanStack Query hooks for parallel data fetching
  const product = useProduct(productId);
  const categories = useCategories({ status: "true" });
  const brands = useBrands({ status: "true" });
  const suppliers = useSuppliers({ status: "true" });

  // Combine loading states
  const isLoading =
    product.isLoading ||
    categories.isLoading ||
    brands.isLoading ||
    suppliers.isLoading;

  // Combine error states
  const error =
    product.error?.message ||
    categories.error?.message ||
    brands.error?.message ||
    suppliers.error?.message ||
    null;

  // Populate form when product data is loaded
  useEffect(() => {
    if (product.data) {
      const productData = product.data;
      form.reset({
        name: productData.name,
        description: productData.description || "",
        sku: productData.sku,
        barcode: productData.barcode || "",
        categoryId: productData.category?.id,
        brandId: productData.brand?.id,
        supplierId: productData.supplier?.id,
        purchasePrice: Number(productData.cost),
        sellingPrice: Number(productData.price),
        currentStock: productData.stock,
        minimumStock: productData.minStock,
        maximumStock: productData.maxStock || undefined,
        status: productData.status,
        notes: "",
      });
    }
  }, [product.data, form]);

  return {
    form,
    product: product.data,
    categories: categories.data?.data || [],
    brands: brands.data?.data || [],
    suppliers: suppliers.data?.data || [],
    isLoading,
    error,
  };
}
