"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertCircle, Save, X } from "lucide-react";
import { toast } from "sonner";
import { updatePurchaseOrderSchema } from "@/lib/validations/purchase-order";
import { usePurchaseOrder } from "@/hooks/api/purchase-orders";
import { useSuppliers } from "@/hooks/api/suppliers";
import { useUpdatePurchaseOrder } from "@/hooks/api/purchase-orders";
import { PageHeader } from "../ui/page-header";
import { BasicOrderInfoSection } from "./edit-purchase-order/BasicOrderInfoSection";
import { FinancialInfoSection } from "./edit-purchase-order/FinancialInfoSection";
import { DeliveryDatesSection } from "./edit-purchase-order/DeliveryDatesSection";
import { OrderSummarySection } from "./edit-purchase-order/OrderSummarySection";
import { StatusNotesSection } from "./edit-purchase-order/StatusNotesSection";
import React from "react";
import { z } from "zod";

interface EditPurchaseOrderFormProps {
  purchaseOrderId: number;
}

type UpdatePurchaseOrderFormData = z.infer<typeof updatePurchaseOrderSchema>;

function LoadingSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-6 w-96" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </div>
  );
}

export default function EditPurchaseOrderForm({
  purchaseOrderId,
}: EditPurchaseOrderFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form setup
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
      status: undefined,
      notes: "",
    },
  });

  // Data fetching
  const {
    data: purchaseOrder,
    isLoading: loadingPurchaseOrder,
    error: purchaseOrderError,
  } = usePurchaseOrder(purchaseOrderId);

  const {
    data: suppliersData,
    isLoading: loadingSuppliers,
    error: suppliersError,
  } = useSuppliers({ isActive: true });

  const updatePurchaseOrderMutation = useUpdatePurchaseOrder();

  // Transform suppliers to form options
  const suppliersOptions =
    suppliersData?.data?.map((supplier) => ({
      value: supplier.id.toString(),
      label: supplier.name,
    })) || [];

  // Populate form when data is loaded
  React.useEffect(() => {
    if (purchaseOrder) {
      console.log("Purchase Order Data:", purchaseOrder);
      console.log("Supplier ID:", purchaseOrder.supplierId);
      console.log("Status:", purchaseOrder.status);
      console.log("Actual Delivery Date:", purchaseOrder.actualDeliveryDate);

      const formData = {
        supplierId: purchaseOrder.supplierId,
        orderNumber: purchaseOrder.orderNumber || "",
        orderDate: purchaseOrder.orderDate
          ? new Date(purchaseOrder.orderDate).toISOString().split("T")[0]
          : "",
        expectedDeliveryDate: purchaseOrder.expectedDeliveryDate
          ? new Date(purchaseOrder.expectedDeliveryDate)
              .toISOString()
              .split("T")[0]
          : "",
        actualDeliveryDate: purchaseOrder.actualDeliveryDate
          ? new Date(purchaseOrder.actualDeliveryDate)
              .toISOString()
              .split("T")[0]
          : "",
        subtotal: parseFloat(purchaseOrder.subtotal) || 0,
        taxAmount: parseFloat(purchaseOrder.taxAmount) || 0,
        shippingCost: purchaseOrder.shippingCost
          ? parseFloat(purchaseOrder.shippingCost)
          : 0,
        totalAmount: parseFloat(purchaseOrder.totalAmount) || 0,
        status: purchaseOrder.status,
        notes: purchaseOrder.notes || "",
      };

      console.log("Form Data:", formData);
      console.log("Form Data Supplier ID:", formData.supplierId);
      console.log("Form Data Status:", formData.status);
      console.log(
        "Form Data Actual Delivery Date:",
        formData.actualDeliveryDate
      );

      form.reset(formData);

      // Log form values after reset
      setTimeout(() => {
        console.log("Form values after reset:", form.getValues());
      }, 100);
    }
  }, [purchaseOrder, form]);

  // Handle form submission
  const onSubmit = async (data: UpdatePurchaseOrderFormData) => {
    try {
      setSubmitError(null);

      // Prepare data for submission - only include fields that have values
      const submitData: any = {};

      if (data.supplierId !== undefined)
        submitData.supplierId = data.supplierId;
      if (data.orderNumber !== undefined)
        submitData.orderNumber = data.orderNumber;
      if (data.orderDate !== undefined) submitData.orderDate = data.orderDate;
      if (data.expectedDeliveryDate !== undefined)
        submitData.expectedDeliveryDate = data.expectedDeliveryDate;
      if (data.actualDeliveryDate !== undefined)
        submitData.actualDeliveryDate = data.actualDeliveryDate;
      if (data.subtotal !== undefined) submitData.subtotal = data.subtotal;
      if (data.taxAmount !== undefined) submitData.taxAmount = data.taxAmount;
      if (data.shippingCost !== undefined)
        submitData.shippingCost = data.shippingCost;
      if (data.totalAmount !== undefined)
        submitData.totalAmount = data.totalAmount;
      if (data.status !== undefined) submitData.status = data.status;
      if (data.notes !== undefined) submitData.notes = data.notes;

      await updatePurchaseOrderMutation.mutateAsync({
        id: purchaseOrderId,
        data: submitData,
      });

      toast.success("Purchase order updated successfully");
      router.push(`/inventory/purchase-orders/${purchaseOrderId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Loading state
  if (loadingPurchaseOrder || loadingSuppliers) {
    return <LoadingSkeleton />;
  }

  // Error states
  if (purchaseOrderError) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load purchase order. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (suppliersError) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load suppliers. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Purchase order not found. Please check the order ID and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/inventory/purchase-orders")}
          className="mb-4 px-4 lg:px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Purchase Orders
        </Button>
        <PageHeader
          title={`Edit Purchase Order #${purchaseOrder.orderNumber}`}
          description="Update order information, financial details, and delivery information"
        />
      </div>

      {/* Error Alert */}
      {submitError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Order Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Order Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <BasicOrderInfoSection
                    form={form}
                    suppliers={suppliersOptions}
                    loadingSuppliers={loadingSuppliers}
                  />
                </CardContent>
              </Card>

              {/* Financial Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Financial Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <FinancialInfoSection form={form} />
                </CardContent>
              </Card>

              {/* Delivery Dates */}
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <DeliveryDatesSection form={form} />
                </CardContent>
              </Card>

              {/* Status and Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Status and Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <StatusNotesSection form={form} />
                </CardContent>
              </Card>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/inventory/purchase-orders")}
                  disabled={updatePurchaseOrderMutation.isPending}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updatePurchaseOrderMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updatePurchaseOrderMutation.isPending
                    ? "Updating..."
                    : "Update Purchase Order"}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Order Summary */}
        <div>
          <OrderSummarySection purchaseOrder={purchaseOrder} />
        </div>
      </div>
    </div>
  );
}
