'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createBrandFormSchema,
  type CreateBrandFormData,
} from '@/lib/validations/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { FormLoading } from '@/components/ui/form-loading';
import { ImageUpload } from '@/components/ui/image-upload';
import { toast } from 'sonner';
import { useCreateBrand } from '@/hooks/api/brands';
import { logger } from '@/lib/logger';

export default function AddBrandForm() {
  const router = useRouter();
  const createBrandMutation = useCreateBrand();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateBrandFormData>({
    resolver: zodResolver(createBrandFormSchema),
    defaultValues: {
      name: '',
      description: null,
      image: null,
      website: null,
      isActive: true,
    },
  });

  const isActive = watch('isActive');

  const onSubmit = async (data: CreateBrandFormData) => {
    // Clean up website URL and description to match Brand interface types
    const brandData = {
      name: data.name,
      description: data.description || undefined,
      image: data.image || undefined,
      website: data.website || undefined,
      isActive: data.isActive,
    };

    try {
      createBrandMutation.mutate(brandData, {
        onSuccess: () => {
          toast.success('Brand created successfully!');
          router.push('/inventory/brands');
        },
        onError: error => {
          logger.error('Failed to create brand', {
            brandName: data.name,
            error: error instanceof Error ? error.message : String(error),
          });
          toast.error('Failed to create brand');
        },
      });
    } catch (error) {
      logger.error('Failed to create brand', {
        brandName: data.name,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error('Failed to create brand');
    }
  };

  // Show loading state
  if (createBrandMutation.isPending) {
    return (
      <FormLoading
        title="Add Brand"
        description="Create a new brand to organize your products"
        backLabel="Back to Brands"
        onBack={() => router.push('/inventory/brands')}
        backUrl="/inventory/brands"
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/inventory/brands')}
          className="mb-4 px-4 lg:px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Brands
        </Button>
        <PageHeader
          title="Add Brand"
          description="Create a new brand to organize your products"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Brand Information</CardTitle>
          <CardDescription>
            Enter the details for the new brand. Required fields are marked with
            an asterisk (*).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Brand Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter brand name"
                disabled={createBrandMutation.isPending}
              />
              {errors.name && (
                <p className="text-destructive text-sm">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Enter brand description (optional)"
                rows={3}
                disabled={createBrandMutation.isPending}
              />
              {errors.description && (
                <p className="text-destructive text-sm">
                  {errors.description.message}
                </p>
              )}
            </div>

            <ImageUpload
              value={watch('image')}
              onChange={url => setValue('image', url)}
              onError={(error: unknown) => {
                // Handle error in form validation
                logger.error('Brand image upload failed', {
                  brandName: watch('name'),
                  error: error instanceof Error ? error.message : String(error),
                });
                toast.error('Failed to upload image');
              }}
              label="Brand Image"
              placeholder="Upload a brand image"
              disabled={createBrandMutation.isPending}
              folder="brands"
              alt="Brand image"
            />
            {errors.image && (
              <p className="text-destructive text-sm">{errors.image.message}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="website">Website URL</Label>
              <Input
                id="website"
                type="url"
                {...register('website')}
                placeholder="https://example.com (optional)"
                disabled={createBrandMutation.isPending}
              />
              {errors.website && (
                <p className="text-destructive text-sm">
                  {errors.website.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="text-base">
                  Active Status
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Active brands will be available for product assignment.
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={checked => setValue('isActive', checked)}
                disabled={createBrandMutation.isPending}
              />
            </div>
            {errors.isActive && (
              <p className="text-destructive text-sm">
                {errors.isActive.message}
              </p>
            )}

            <div className="flex items-center gap-4 pt-4">
              <Button
                type="submit"
                disabled={createBrandMutation.isPending}
                className="flex items-center gap-2"
              >
                {createBrandMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {createBrandMutation.isPending ? 'Creating...' : 'Create Brand'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/inventory/brands')}
                disabled={createBrandMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
