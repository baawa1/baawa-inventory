import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updatePurchaseOrderSchema,
  UpdatePurchaseOrderFormData,
} from "./types";
import { usePurchaseOrder } from "@/hooks/api/purchase-orders";

export function useEditPurchaseOrderData(purchaseOrderId: number) {
  const form = useForm<UpdatePurchaseOrderFormData>({
    resolver: zodResolver(updatePurchaseOrderSchema),
    defaultValues: {
      status: "draft",
      notes: "",
      expectedDeliveryDate: undefined,
      actualDeliveryDate: undefined,
    },
  });

  // TanStack Query hook for data fetching
  const purchaseOrder = usePurchaseOrder(purchaseOrderId);

  // Populate form when data is loaded
  useEffect(() => {
    if (purchaseOrder.data) {
      const purchaseOrderData = purchaseOrder.data;

      // Use setTimeout to ensure the form reset happens after the current render cycle
      setTimeout(() => {
        form.reset({
          status: purchaseOrderData.status,
          notes: purchaseOrderData.notes || "",
          expectedDeliveryDate: purchaseOrderData.expectedDeliveryDate
            ? new Date(purchaseOrderData.expectedDeliveryDate)
                .toISOString()
                .split("T")[0]
            : undefined,
          actualDeliveryDate: purchaseOrderData.actualDeliveryDate
            ? new Date(purchaseOrderData.actualDeliveryDate)
                .toISOString()
                .split("T")[0]
            : undefined,
        });
      }, 0);
    }
  }, [purchaseOrder.data, form]);

  return {
    form,
    purchaseOrder: purchaseOrder.data,
    loading: purchaseOrder.isLoading,
  };
}
