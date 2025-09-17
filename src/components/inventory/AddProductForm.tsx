'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createProductSchema } from '@/lib/validations/product';

import { BasicInfoSection } from './add-product/BasicInfoSection';
import { CategoryBrandSection } from './add-product/CategoryBrandSection';
import { PricingInventorySection } from './add-product/PricingInventorySection';
import { AdditionalInfoSection } from './add-product/AdditionalInfoSection';
import { ProductImageSection } from './add-product/ProductImageSection';
import { FormActions } from './add-product/FormActions';
import { useFormDataQuery } from './add-product/useFormDataQuery';
import { useProductSubmit } from './add-product/useProductSubmit';
import { defaultFormValues } from './add-product/types';
import { usePermissions } from '@/hooks/usePermissions';
import { z } from 'zod';

type CreateProductData = z.infer<typeof createProductSchema>;

export default function AddProductForm() {
  const router = useRouter();
  const [images, setImages] = useState<CreateProductData['images']>([]);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const permissions = usePermissions();

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

  // Create form default values based on user permissions
  const formDefaultValues = {
    ...defaultFormValues,
    ...(permissions.canViewCost ? {} : { purchasePrice: undefined }),
  };

  const form = useForm({
    resolver: zodResolver(createProductSchema),
    defaultValues: formDefaultValues,
  });

  const { onSubmit } = useProductSubmit(form, setIsSubmitting, setSubmitError);

  // Update form images when local images state changes
  useEffect(() => {
    form.setValue('images', images);
  }, [images, form]);

  // Set first supplier as default when suppliers load
  useEffect(() => {
    if (suppliers.length > 0 && !form.getValues('supplierId')) {
      form.setValue('supplierId', suppliers[0].id);
    }
  }, [suppliers, form]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-3 sm:space-y-6 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/inventory/products')}
            className="mb-3 px-3 sm:mb-4 sm:px-4 lg:px-6"
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
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-center py-8 sm:py-12">
              <Loader2 className="mr-3 h-6 w-6 animate-spin sm:h-8 sm:w-8" />
              <span>Loading form...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-3 sm:space-y-6 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/inventory/products')}
          className="mb-3 px-3 sm:mb-4 sm:px-4 lg:px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
        <PageHeader
          title="Add New Product"
          description="Create a new product in your inventory"
        />
      </div>

      <Card className="gap-0">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">
            Product Information
          </CardTitle>
          <CardDescription className="text-sm">
            Enter the details for your new product. Required fields are marked
            with an asterisk (*).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 sm:space-y-6"
            >
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

              <ProductImageSection
                form={form}
                images={images}
                onImagesChange={setImages}
                onUploadingChange={setIsImageUploading}
              />

              <FormActions
                isSubmitting={isSubmitting}
                isImageUploading={isImageUploading}
                onCancelAction={() => router.push('/inventory/products')}
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
