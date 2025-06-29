"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Category, Brand, Supplier, FormState } from "./types";

export function useFormData() {
  const [state, setState] = useState<FormState>({
    loading: true,
    isSubmitting: false,
    submitError: null,
    categories: [],
    brands: [],
    suppliers: [],
  });

  useEffect(() => {
    const loadFormData = async () => {
      try {
        const [categoriesRes, brandsRes, suppliersRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/brands"),
          fetch("/api/suppliers"),
        ]);

        const updates: Partial<FormState> = {};

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          updates.categories = categoriesData.data || [];
        }

        if (brandsRes.ok) {
          const brandsData = await brandsRes.json();
          updates.brands = brandsData.data || [];
        }

        if (suppliersRes.ok) {
          const suppliersData = await suppliersRes.json();
          updates.suppliers = suppliersData.suppliers || [];
        } else {
          console.error(
            "Failed to fetch suppliers:",
            suppliersRes.status,
            suppliersRes.statusText
          );
          toast.error("Failed to load suppliers");
        }

        setState((prev) => ({ ...prev, ...updates, loading: false }));
      } catch (error) {
        console.error("Error loading form data:", error);
        toast.error("Failed to load form data. Please refresh the page.");
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    loadFormData();
  }, []);

  const setIsSubmitting = (isSubmitting: boolean) => {
    setState((prev) => ({ ...prev, isSubmitting }));
  };

  const setSubmitError = (error: string | null) => {
    setState((prev) => ({ ...prev, submitError: error }));
  };

  return {
    ...state,
    setIsSubmitting,
    setSubmitError,
  };
}
