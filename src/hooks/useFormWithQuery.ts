import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { UseQueryResult } from "@tanstack/react-query";

interface UseFormWithQueryOptions<TData> {
  form: UseFormReturn<any>;
  query: UseQueryResult<TData>;
  onDataReceived?: (data: TData) => void;
  resetOnDataChange?: boolean;
}

/**
 * Hook that integrates React Hook Form with TanStack Query
 * Automatically populates form with query data and handles loading states
 */
export function useFormWithQuery<TData>({
  form,
  query,
  onDataReceived,
  resetOnDataChange = true,
}: UseFormWithQueryOptions<TData>) {
  const { data, isLoading, error, isSuccess } = query;

  // Populate form when data is received
  useEffect(() => {
    if (isSuccess && data && resetOnDataChange) {
      if (onDataReceived) {
        onDataReceived(data);
      } else {
        // Default behavior: reset form with data
        form.reset(data);
      }
    }
  }, [isSuccess, data, form, onDataReceived, resetOnDataChange]);

  // Reset form errors when query starts loading
  useEffect(() => {
    if (isLoading) {
      form.clearErrors();
    }
  }, [isLoading, form]);

  return {
    isLoading,
    error,
    isSuccess,
    data,
    isFormReady: isSuccess && !isLoading,
  };
}
