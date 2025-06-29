import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProductSchema } from "@/lib/validations/product";
import { FormData, FormState, Product, UpdateProductFormData } from "./types";
import type { z } from "zod";

type UpdateProductData = z.infer<typeof updateProductSchema>;

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

  const [formData, setFormData] = useState<FormData>({
    categories: [],
    brands: [],
    suppliers: [],
    product: null,
  });

  const [formState, setFormState] = useState<FormState>({
    loading: true,
    isSubmitting: false,
    submitError: null,
    loadingCategories: true,
    loadingBrands: true,
    loadingSuppliers: true,
  });

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setFormState((prev) => ({ ...prev, loading: true }));
        const response = await fetch(`/api/products/${productId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch product");
        }

        const result = await response.json();
        const product: Product = result.data;
        setFormData((prev) => ({ ...prev, product }));

        // Populate form with product data
        form.reset({
          name: product.name,
          description: product.description || "",
          sku: product.sku,
          barcode: product.barcode || "",
          categoryId: product.category?.id,
          brandId: product.brand?.id,
          supplierId: product.supplier_id,
          purchasePrice: Number(product.cost),
          sellingPrice: Number(product.price),
          currentStock: product.stock,
          minimumStock: product.min_stock,
          maximumStock: product.max_stock || undefined,
          status: product.status,
          notes: "",
        });
      } catch (error) {
        setFormState((prev) => ({
          ...prev,
          submitError:
            error instanceof Error ? error.message : "Failed to fetch product",
        }));
      } finally {
        setFormState((prev) => ({ ...prev, loading: false }));
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, form]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setFormState((prev) => ({ ...prev, loadingCategories: true }));
        const response = await fetch("/api/categories");

        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }

        const data = await response.json();
        setFormData((prev) => ({ ...prev, categories: data.categories || [] }));
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setFormState((prev) => ({ ...prev, loadingCategories: false }));
      }
    };

    fetchCategories();
  }, []);

  // Fetch brands
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setFormState((prev) => ({ ...prev, loadingBrands: true }));
        const response = await fetch("/api/brands");

        if (!response.ok) {
          throw new Error("Failed to fetch brands");
        }

        const data = await response.json();
        setFormData((prev) => ({ ...prev, brands: data.brands || [] }));
      } catch (error) {
        console.error("Error fetching brands:", error);
      } finally {
        setFormState((prev) => ({ ...prev, loadingBrands: false }));
      }
    };

    fetchBrands();
  }, []);

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setFormState((prev) => ({ ...prev, loadingSuppliers: true }));
        const response = await fetch("/api/suppliers");

        if (!response.ok) {
          throw new Error("Failed to fetch suppliers");
        }

        const data = await response.json();
        setFormData((prev) => ({ ...prev, suppliers: data.suppliers || [] }));
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      } finally {
        setFormState((prev) => ({ ...prev, loadingSuppliers: false }));
      }
    };

    fetchSuppliers();
  }, []);

  return {
    form,
    product: formData.product,
    categories: formData.categories,
    brands: formData.brands,
    suppliers: formData.suppliers,
    loading: formState.loading,
    loadingCategories: formState.loadingCategories,
    loadingBrands: formState.loadingBrands,
    loadingSuppliers: formState.loadingSuppliers,
    setIsSubmitting: (isSubmitting: boolean) => {
      setFormState((prev) => ({ ...prev, isSubmitting }));
    },
    setSubmitError: (error: string | null) => {
      setFormState((prev) => ({ ...prev, submitError: error }));
    },
  };
}
