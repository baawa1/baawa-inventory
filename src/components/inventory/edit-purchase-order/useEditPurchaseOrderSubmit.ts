import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { UpdatePurchaseOrderFormData } from "./types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useEditPurchaseOrderSubmit(
  purchaseOrderId: number,
  _form: UseFormReturn<UpdatePurchaseOrderFormData>
) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (data: UpdatePurchaseOrderFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Prepare data for submission
      const submitData = {
        status: data.status,
        notes: data.notes || null,
        expectedDeliveryDate: data.expectedDeliveryDate || undefined,
        actualDeliveryDate: data.actualDeliveryDate || undefined,
      };

      const response = await fetch(`/api/purchase-orders/${purchaseOrderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update purchase order");
      }

      toast.success("Purchase order updated successfully");
      router.push(`/inventory/purchase-orders/${purchaseOrderId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { onSubmit, isSubmitting, submitError };
}
