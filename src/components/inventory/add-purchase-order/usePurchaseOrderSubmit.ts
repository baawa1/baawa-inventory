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
      // Ensure all numeric fields are properly typed
      const cleanedData = {
        ...data,
        supplierId: Number(data.supplierId),
        subtotal: Number(data.subtotal),
        taxAmount: Number(data.taxAmount),
        shippingCost: Number(data.shippingCost),
        totalAmount: Number(data.totalAmount),
        items: data.items.map((item) => ({
          ...item,
          productId: item.productId ? Number(item.productId) : undefined,
          variantId: item.variantId ? Number(item.variantId) : undefined,
          quantityOrdered: Number(item.quantityOrdered),
          unitCost: Number(item.unitCost),
          totalCost: Number(item.totalCost),
        })),
        notes: data.notes?.trim() || null,
        expectedDeliveryDate: data.expectedDeliveryDate?.trim() || null,
      };

      const response = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
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
