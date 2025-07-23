import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updatePurchaseOrderSchema } from "@/lib/validations/purchase-order";
import { UpdatePurchaseOrderFormData, FormOption } from "./types";
import { usePurchaseOrder } from "@/hooks/api/purchase-orders";
import { useSuppliers } from "@/hooks/api/suppliers";

export function useEditPurchaseOrderData(purchaseOrderId: number) {
  const form = useForm<UpdatePurchaseOrderFormData>({
    resolver: zodResolver(updatePurchaseOrderSchema),
    defaultValues: {
      supplierId: undefined,
      orderNumber: "",
      orderDate: "",
      expectedDeliveryDate: "",
      actualDeliveryDate: "",
      subtotal: 0,
      taxAmount: 0,
      shippingCost: 0,
      totalAmount: 0,
      status: "DRAFT",
      notes: "",
    },
  });

  // TanStack Query hooks for data fetching
  const purchaseOrder = usePurchaseOrder(purchaseOrderId);
  const suppliers = useSuppliers({ isActive: true });

  // Combine loading states
  const loading = purchaseOrder.isLoading || suppliers.isLoading;
  const loadingSuppliers = suppliers.isLoading;

  // Transform suppliers to FormOption format
  const suppliersOptions: FormOption[] =
    suppliers.data?.data?.map((supplier) => ({
      value: supplier.id.toString(),
      label: supplier.name,
    })) || [];

  // Populate form when data is loaded
  useEffect(() => {
    if (purchaseOrder.data) {
      const purchaseOrderData = purchaseOrder.data;

      // Use setTimeout to ensure the form reset happens after the current render cycle
      setTimeout(() => {
        const formData = {
          supplierId: purchaseOrderData.supplierId,
          orderNumber: purchaseOrderData.orderNumber,
          orderDate: purchaseOrderData.orderDate
            ? new Date(purchaseOrderData.orderDate).toISOString().split("T")[0]
            : "",
          expectedDeliveryDate: purchaseOrderData.expectedDeliveryDate
            ? new Date(purchaseOrderData.expectedDeliveryDate)
                .toISOString()
                .split("T")[0]
            : "",
          actualDeliveryDate: purchaseOrderData.actualDeliveryDate
            ? new Date(purchaseOrderData.actualDeliveryDate)
                .toISOString()
                .split("T")[0]
            : "",
          subtotal: parseFloat(purchaseOrderData.subtotal) || 0,
          taxAmount: parseFloat(purchaseOrderData.taxAmount) || 0,
          shippingCost: purchaseOrderData.shippingCost
            ? parseFloat(purchaseOrderData.shippingCost)
            : 0,
          totalAmount: parseFloat(purchaseOrderData.totalAmount) || 0,
          status: purchaseOrderData.status,
          notes: purchaseOrderData.notes || "",
        };

        form.reset(formData);
      }, 0);
    }
  }, [purchaseOrder.data, form, suppliers]);

  return {
    form,
    purchaseOrder: purchaseOrder.data,
    suppliers: suppliersOptions,
    loading,
    loadingSuppliers,
  };
}
