import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProductSchema } from "@/lib/validations/product";
import { UpdateProductFormData } from "./types";
import { useProduct } from "@/hooks/api/products";
import { useCategories } from "@/hooks/api/categories";
import { useBrands } from "@/hooks/api/brands";
import { useSuppliers } from "@/hooks/api/suppliers";

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
      // New fields
      unit: "piece",
      weight: undefined,
      dimensions: "",
      color: "",
      size: "",
      material: "",
      tags: [],
      salePrice: undefined,
      saleStartDate: undefined,
      saleEndDate: undefined,
      metaTitle: "",
      metaDescription: "",
      seoKeywords: [],
      isFeatured: false,
      sortOrder: undefined,
    },
  });

  // TanStack Query hooks for parallel data fetching
  const product = useProduct(productId);
  const categories = useCategories({ status: "true" });
  const brands = useBrands({ status: "true" });
  const suppliers = useSuppliers({ status: "true" });

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
        minimumStock: productData.minStock,
        maximumStock: productData.maxStock || undefined,
        status: productData.status,
        notes: "",
        // New fields
        unit: productData.unit || "piece",
        weight: productData.weight || undefined,
        dimensions: productData.dimensions || "",
        color: productData.color || "",
        size: productData.size || "",
        material: productData.material || "",
        tags: productData.tags || [],
        salePrice: productData.salePrice || undefined,
        saleStartDate: productData.saleStartDate
          ? new Date(productData.saleStartDate)
          : undefined,
        saleEndDate: productData.saleEndDate
          ? new Date(productData.saleEndDate)
          : undefined,
        metaTitle: productData.metaTitle || "",
        metaDescription: productData.metaDescription || "",
        seoKeywords: productData.seoKeywords || [],
        isFeatured: productData.isFeatured || false,
        sortOrder: productData.sortOrder || undefined,
      });
    }
  }, [product.data, form]);

  return {
    form,
    product: product.data,
    categories: Array.isArray(categories.data?.data)
      ? categories.data.data
      : [],
    brands: Array.isArray(brands.data?.data) ? brands.data.data : [],
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
