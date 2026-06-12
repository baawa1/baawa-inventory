'use client';

import { useState } from 'react';
import { useCategories } from '@/hooks/api/categories';
import { useBrands } from '@/hooks/api/brands';
import { useSuppliers } from '@/hooks/api/suppliers';
import type {
  AddProductBrand,
  AddProductCategory,
  AddProductSupplier,
} from './types';

export function useFormData() {
  // Use TanStack Query hooks for data fetching
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories();
  const {
    data: brandsData,
    isLoading: brandsLoading,
    error: brandsError,
  } = useBrands();
  const {
    data: suppliersData,
    isLoading: suppliersLoading,
    error: suppliersError,
  } = useSuppliers();

  // Local state for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Combine loading states
  const loading = categoriesLoading || brandsLoading || suppliersLoading;

  // Extract data arrays with proper fallbacks
  const categories: AddProductCategory[] = categoriesData?.data || [];
  const brands: AddProductBrand[] = brandsData?.data || [];
  const suppliers: AddProductSupplier[] = suppliersData?.data || [];

  // Handle errors (TanStack Query handles retry and error states automatically)
  const hasError = categoriesError || brandsError || suppliersError;

  return {
    loading,
    isSubmitting,
    submitError,
    categories,
    brands,
    suppliers,
    setIsSubmitting,
    setSubmitError: (error: string | null) => setSubmitError(error),
    hasDataError: !!hasError,
    dataError: hasError ? (hasError as Error).message : null,
  };
}
