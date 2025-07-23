"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Form } from "@/components/ui/form";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEditPurchaseOrderData } from "./edit-purchase-order/useEditPurchaseOrderData";
import { useEditPurchaseOrderSubmit } from "./edit-purchase-order/useEditPurchaseOrderSubmit";
import { BasicOrderInfoSection } from "./edit-purchase-order/BasicOrderInfoSection";
import { FinancialInfoSection } from "./edit-purchase-order/FinancialInfoSection";
import { DeliveryDatesSection } from "./edit-purchase-order/DeliveryDatesSection";
import { OrderSummarySection } from "./edit-purchase-order/OrderSummarySection";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "../ui/page-header";

interface EditPurchaseOrderFormProps {
  purchaseOrderId: number;
}

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
  const { form, purchaseOrder, suppliers, loading, loadingSuppliers } =
    useEditPurchaseOrderData(purchaseOrderId);
  const { onSubmit, isSubmitting, submitError } = useEditPurchaseOrderSubmit(
    purchaseOrderId,
    form
  );

  if (loading) {
    return <LoadingSkeleton />;
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
              <BasicOrderInfoSection
                form={form}
                suppliers={suppliers}
                loadingSuppliers={loadingSuppliers}
              />

              <FinancialInfoSection form={form} />

              <DeliveryDatesSection form={form} />

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/inventory/purchase-orders")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Purchase Order"}
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
