import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";

interface ToastMessages {
  loading?: string;
  success?: string | ((data: any) => string);
  error?: string | ((error: any) => string);
}

interface UseToastMutationOptions<TData, TError, TVariables, TContext>
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'onSuccess' | 'onError'> {
  messages?: ToastMessages;
  onSuccess?: (data: TData, variables: TVariables, context: TContext) => void;
  onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void;
  showToast?: boolean;
}

/**
 * Hook that wraps useMutation with automatic toast notifications
 * Provides consistent error handling and success messaging across the app
 */
export function useToastMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown
>({
  messages = {},
  onSuccess,
  onError,
  showToast = true,
  ...mutationOptions
}: UseToastMutationOptions<TData, TError, TVariables, TContext>) {
  
  const {
    loading = "Processing...",
    success = "Operation completed successfully",
    error = "An error occurred",
  } = messages;

  return useMutation({
    ...mutationOptions,
    onMutate: (variables) => {
      if (showToast && loading) {
        toast.loading(loading);
      }
      return mutationOptions.onMutate?.(variables);
    },
    onSuccess: (data, variables, context) => {
      if (showToast) {
        toast.dismiss();
        const successMessage = typeof success === "function" 
          ? success(data) 
          : success;
        toast.success(successMessage);
      }
      onSuccess?.(data, variables, context);
    },
    onError: (err, variables, context) => {
      if (showToast) {
        toast.dismiss();
        const errorMessage = typeof error === "function" 
          ? error(err) 
          : error;
        toast.error(errorMessage);
      }
      onError?.(err, variables, context);
    },
  });
}

/**
 * Convenience hook for common mutation patterns with predefined messages
 */
export function useCreateMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  entityName: string = "item"
) {
  return useToastMutation({
    mutationFn,
    messages: {
      loading: `Creating ${entityName}...`,
      success: `${entityName} created successfully`,
      error: `Failed to create ${entityName}`,
    },
  });
}

export function useUpdateMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  entityName: string = "item"
) {
  return useToastMutation({
    mutationFn,
    messages: {
      loading: `Updating ${entityName}...`,
      success: `${entityName} updated successfully`,
      error: `Failed to update ${entityName}`,
    },
  });
}

export function useDeleteMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  entityName: string = "item"
) {
  return useToastMutation({
    mutationFn,
    messages: {
      loading: `Deleting ${entityName}...`,
      success: `${entityName} deleted successfully`,
      error: `Failed to delete ${entityName}`,
    },
  });
}
