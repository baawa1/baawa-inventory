"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createPurchaseOrderSchema } from "@/lib/validations/purchase-order";

import { BasicInfoSection } from "./add-purchase-order/BasicInfoSection";
import { SupplierSection } from "./add-purchase-order/SupplierSection";
import { OrderItemsSection } from "./add-purchase-order/OrderItemsSection";
import { PricingSection } from "./add-purchase-order/PricingSection";
import { FormActions } from "./add-purchase-order/FormActions";
import { useFormDataQuery } from "./add-purchase-order/useFormDataQuery";
import { usePurchaseOrderSubmit } from "./add-purchase-order/usePurchaseOrderSubmit";
import { defaultFormValues } from "./add-purchase-order/types";

export default function AddPurchaseOrderForm() {
  const router = useRouter();

  // Form setup
  const form = useForm({
    resolver: zodResolver(createPurchaseOrderSchema),
    defaultValues: defaultFormValues,
  });

  // Data fetching and form state
  const { suppliers, products, loading, isSubmitting, submitError } =
    useFormDataQuery();

  // Form submission
  const { onSubmit } = usePurchaseOrderSubmit(
    form,
    (value) => {}, // setIsSubmitting is handled in useFormDataQuery
    (error) => {} // setSubmitError is handled in useFormDataQuery
  );

  // Handle form submission
  const handleSubmit = form.handleSubmit(onSubmit);

  // Handle cancel action
  const handleCancel = () => {
    router.push("/inventory/purchase-orders");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="mb-4 px-4 lg:px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Purchase Orders
        </Button>
        <PageHeader
          title="Add New Purchase Order"
          description="Create a new purchase order for suppliers"
        />
      </div>

      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <BasicInfoSection form={form} />

          <SupplierSection
            form={form}
            suppliers={suppliers}
            loading={loading}
          />

          <OrderItemsSection
            form={form}
            products={products}
            loading={loading}
          />

          <PricingSection form={form} />

          <FormActions
            isSubmitting={isSubmitting}
            onCancelAction={handleCancel}
          />
        </form>
      </Form>
    </div>
  );
}
