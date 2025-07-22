"use client";

import { UseFormReturn } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CreatePurchaseOrderData } from "./types";
import { logger } from "@/lib/logger";

export function usePurchaseOrderSubmit(
  form: UseFormReturn<CreatePurchaseOrderData>,
  setIsSubmitting: (_value: boolean) => void,
  setSubmitError: (_error: string | null) => void
) {
  const router = useRouter();

  const onSubmit = async (data: CreatePurchaseOrderData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Convert empty strings to null for optional fields
      const cleanedData = {
        ...data,
        notes: data.notes?.trim() || null,
        expectedDeliveryDate: data.expectedDeliveryDate?.trim() || null,
      };

      const response = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create purchase order");
      }

      const _result = await response.json();

      // Show success notification
      toast.success("Purchase order created successfully!");

      // Redirect to purchase orders list
      router.push("/inventory/purchase-orders");
    } catch (error) {
      logger.error("Failed to create purchase order", {
        orderNumber: data.orderNumber,
        supplierId: data.supplierId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { onSubmit };
}
