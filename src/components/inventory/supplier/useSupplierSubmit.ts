import { UseFormReturn } from "react-hook-form";
import { updateSupplierSchema } from "@/lib/validations/supplier";
import { z } from "zod";
import { toast } from "sonner";

type SupplierFormData = z.infer<typeof updateSupplierSchema>;

interface UseSupplierSubmitResult {
  onSubmit: (data: SupplierFormData) => Promise<void>;
}

export function useSupplierSubmit(
  form: UseFormReturn<SupplierFormData>,
  supplierId: number | null,
  setIsSubmitting: (value: boolean) => void,
  setSubmitError: (value: string | null) => void,
  onSuccess?: () => void,
  onClose?: () => void
): UseSupplierSubmitResult {
  const onSubmit = async (data: SupplierFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const isCreating = supplierId === null;
      const url = isCreating
        ? "/api/suppliers"
        : `/api/suppliers/${supplierId}`;
      const method = isCreating ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            `Failed to ${isCreating ? "create" : "update"} supplier`
        );
      }

      if (result.success) {
        toast.success(
          `Supplier ${isCreating ? "created" : "updated"} successfully`
        );
        onSuccess?.();
        onClose?.();
      } else {
        throw new Error(
          result.message ||
            `Failed to ${isCreating ? "create" : "update"} supplier`
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { onSubmit };
}
