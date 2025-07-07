import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProductSchema } from "@/lib/validations/product";
import { UpdateProductFormData } from "./types";
import { useProduct, useCategories, useBrands } from "@/hooks/api/products";
import { useSuppliers } from "@/hooks/api/suppliers";
import type { z } from "zod";

export function useEditProductData(productId: number) {
  const form = useForm<UpdateProductFormData>({
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
  const categories = useCategories({ isActive: true });
  const brands = useBrands({ isActive: true });
  const suppliers = useSuppliers({ status: "active" });

  // Combine loading states
  const loading =
    product.isLoading ||
    categories.isLoading ||
    brands.isLoading ||
    suppliers.isLoading;

  const loadingCategories = categories.isLoading;
  const loadingBrands = brands.isLoading;
  const loadingSuppliers = suppliers.isLoading;

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
        minimumStock: productData.min_stock,
        maximumStock: productData.max_stock || undefined,
        status: productData.status,
        notes: "",
      });
    }
  }, [product.data, form]);

  return {
    form,
    product: product.data,
    categories: Array.isArray(categories.data) ? categories.data : [],
    brands: Array.isArray(brands.data) ? brands.data : [],
    suppliers: Array.isArray(suppliers.data?.data) ? suppliers.data.data : [],
    loading,
    loadingCategories,
    loadingBrands,
    loadingSuppliers,
    setIsSubmitting: () => {
      // This is now handled in the parent component or submit hook
    },
    setSubmitError: () => {
      // This is now handled in the parent component or submit hook
    },
  };
}
