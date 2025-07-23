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

      // Prepare data for submission - only include fields that have values
      const submitData: any = {};

      if (data.supplierId !== undefined)
        submitData.supplierId = data.supplierId;
      if (data.orderNumber) submitData.orderNumber = data.orderNumber;
      if (data.orderDate) submitData.orderDate = data.orderDate;
      if (data.expectedDeliveryDate)
        submitData.expectedDeliveryDate = data.expectedDeliveryDate;
      if (data.actualDeliveryDate)
        submitData.actualDeliveryDate = data.actualDeliveryDate;
      if (data.subtotal !== undefined) submitData.subtotal = data.subtotal;
      if (data.taxAmount !== undefined) submitData.taxAmount = data.taxAmount;
      if (data.shippingCost !== undefined)
        submitData.shippingCost = data.shippingCost;
      if (data.totalAmount !== undefined)
        submitData.totalAmount = data.totalAmount;
      if (data.status) submitData.status = data.status;
      if (data.notes !== undefined) submitData.notes = data.notes;

      const response = await fetch(`/api/purchase-orders/${purchaseOrderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
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
