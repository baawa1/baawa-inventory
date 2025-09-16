'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { AlertCircle, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEditProductData } from './edit-product/useEditProductData';
import { useEditProductSubmit } from './edit-product/useEditProductSubmitNew';
import { BasicInfoSection } from './edit-product/BasicInfoSection';
import { CategoryBrandSupplierSection } from './edit-product/CategoryBrandSupplierSection';
import { PricingInventorySection } from './edit-product/PricingInventorySection';
import { ProductImageSection } from './add-product/ProductImageSection';

import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '../ui/page-header';

interface EditProductFormProps {
  productId: number;
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-3 sm:space-y-6 sm:p-6">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <Skeleton className="h-5 w-48 sm:h-6" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditProductForm({ productId }: EditProductFormProps) {
  const router = useRouter();
  const [images, setImages] = useState<any[]>([]);

  const {
    form,
    product,
    categories,
    brands,
    suppliers,
    loading,
    loadingCategories,
    loadingBrands,
    loadingSuppliers,
  } = useEditProductData(productId);

  const { isSubmitting, submitError, onSubmit } = useEditProductSubmit(
    productId,
    form
  );

  // Initialize images from product data when available
  useEffect(() => {
    if (product?.images) {
      // Convert product images to the format expected by ProductImageSection
      const formattedImages = product.images.map((img: any) => ({
        url: img.url || img,
        filename: img.filename || 'product-image.jpg',
        mimeType: img.mimeType || 'image/jpeg',
        alt: img.alt || product.name,
        isPrimary: img.isPrimary || false,
        uploadedAt: img.uploadedAt || new Date().toISOString(),
        size: img.size || 0,
      }));
      setImages(formattedImages);
    }
  }, [product]);

  // Update form images when local images state changes
  useEffect(() => {
    if (form) {
      form.setValue('images', images);
    }
  }, [images, form]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-4xl p-3 sm:p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Product not found. Please check the product ID and try again.
          </AlertDescription>
        </Alert>
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          <PageHeader
            title="Edit Product"
            description="Update the details for your product"
          />
          <Button variant="outline" asChild className="self-start sm:self-auto">
            <Link href={`/inventory/products/${productId}/images`}>
              <ImageIcon className="mr-2 h-4 w-4" />
              <span className="hidden xs:inline">Manage </span>Images
            </Link>
          </Button>
        </div>
      </div>

      {submitError && (
        <Alert variant="destructive" className="mb-4 sm:mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Product Information</CardTitle>
          <CardDescription className="text-sm">
            Update the details for {product.name}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              <BasicInfoSection form={form} />

              <CategoryBrandSupplierSection
                form={form}
                categories={categories}
                brands={brands}
                suppliers={suppliers}
                loadingCategories={loadingCategories}
                loadingBrands={loadingBrands}
                loadingSuppliers={loadingSuppliers}
              />

              <PricingInventorySection form={form} />

              <ProductImageSection
                form={form}
                images={images}
                onImagesChange={setImages}
              />

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 border-t pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/inventory/products')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update Product'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
