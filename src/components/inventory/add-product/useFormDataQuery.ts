"use client";

import { useState } from "react";
import { useCategoryOptions } from "@/hooks/api/categories";
import { useBrandOptions } from "@/hooks/api/brands";
import { useSupplierOptions } from "@/hooks/api/suppliers";

export function useFormDataQuery() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Use TanStack Query hooks for options data
  const {
    data: categoryOptions = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategoryOptions();

  const {
    data: brandOptions = [],
    isLoading: brandsLoading,
    error: brandsError,
  } = useBrandOptions();

  const {
    data: supplierOptions = [],
    isLoading: suppliersLoading,
    error: suppliersError,
  } = useSupplierOptions();

  // Convert options to full objects for compatibility with existing form sections
  const categories = categoryOptions.map(
    (option: { value: string; label: string }) => ({
      id: parseInt(option.value),
      name: option.label,
    })
  );

  const brands = brandOptions.map(
    (option: { value: string; label: string }) => ({
      id: parseInt(option.value),
      name: option.label,
    })
  );

  const suppliers = supplierOptions.map(
    (option: { value: string; label: string }) => ({
      id: parseInt(option.value),
      name: option.label,
    })
  );

  const loading = categoriesLoading || brandsLoading || suppliersLoading;
  const error = categoriesError || brandsError || suppliersError;

  return {
    loading,
    error,
    isSubmitting,
    submitError,
    categories,
    brands,
    suppliers,
    categoryOptions,
    brandOptions,
    supplierOptions,
    setIsSubmitting,
    setSubmitError,
  };
}
