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
import { createProductSchema } from "@/lib/validations/product";

import { BasicInfoSection } from "./add-product/BasicInfoSection";
import { CategoryBrandSection } from "./add-product/CategoryBrandSection";
import { PricingInventorySection } from "./add-product/PricingInventorySection";
import { AdditionalInfoSection } from "./add-product/AdditionalInfoSection";
import { FormActions } from "./add-product/FormActions";
import { useFormDataQuery } from "./add-product/useFormDataQuery";
import { useProductSubmit } from "./add-product/useProductSubmit";
import { defaultFormValues } from "./add-product/types";

export default function AddProductForm() {
  const router = useRouter();
  const {
    loading,
    isSubmitting,
    submitError,
    categories,
    brands,
    suppliers,
    setIsSubmitting,
    setSubmitError,
  } = useFormDataQuery();

  const form = useForm({
    resolver: zodResolver(createProductSchema),
    defaultValues: defaultFormValues,
  });

  const { onSubmit } = useProductSubmit(form, setIsSubmitting, setSubmitError);

  // Set first supplier as default when suppliers load
  useEffect(() => {
    if (suppliers.length > 0 && !form.getValues("supplierId")) {
      form.setValue("supplierId", suppliers[0].id);
    }
  }, [suppliers, form]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/inventory/products")}
            className="mb-4 px-4 lg:px-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
          <PageHeader
            title="Add New Product"
            description="Create a new product in your inventory"
          />
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mr-3" />
              <span>Loading form...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/inventory/products")}
          className="mb-4 px-4 lg:px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
        <PageHeader
          title="Add New Product"
          description="Create a new product in your inventory"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
          <CardDescription>
            Enter the details for your new product. Required fields are marked
            with an asterisk (*).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {submitError && (
                <Alert variant="destructive">
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              <BasicInfoSection form={form} />

              <CategoryBrandSection
                form={form}
                categories={categories}
                brands={brands}
                suppliers={suppliers}
                loading={loading}
              />

              <PricingInventorySection form={form} />

              <AdditionalInfoSection form={form} />

              <FormActions
                isSubmitting={isSubmitting}
                onCancelAction={() => router.push("/inventory/products")}
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
