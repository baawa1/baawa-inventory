"use client";

import { useState } from "react";
import { useSupplierOptions } from "@/hooks/api/suppliers";
import { useProducts } from "@/hooks/api/products";

export function useFormDataQuery() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Use TanStack Query hooks for data fetching
  const {
    data: supplierOptions = [],
    isLoading: suppliersLoading,
    error: suppliersError,
  } = useSupplierOptions();

  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useProducts(
    {}, // filters
    { limit: 1000 } // pagination - get all products for selection
  );

  // Convert supplier options to full objects for compatibility
  const suppliers = supplierOptions.map(
    (option: { value: string; label: string }) => ({
      id: parseInt(option.value),
      name: option.label,
      isActive: true,
    })
  );

  // Extract products from the API response
  const products = productsData?.data || [];

  const loading = suppliersLoading || productsLoading;
  const error = suppliersError || productsError;

  return {
    loading,
    error,
    isSubmitting,
    submitError,
    suppliers,
    products,
    supplierOptions,
    setIsSubmitting,
    setSubmitError,
  };
}
