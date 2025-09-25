'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import { FormLoading } from '@/components/ui/form-loading';

import { toast } from 'sonner';
import { useUpdateCategory, type UpdateCategoryData } from '@/hooks/api/categories';
import { logger } from '@/lib/logger';

interface Category {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  wordpress_id?: number | null;
}

interface EditCategoryFormProps {
  category: Category;
}

const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be 100 characters or less')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean(),
  wordpress_id: z.number().int().positive('WordPress ID must be a positive integer').nullable().optional(),
});

type UpdateCategoryFormData = z.infer<typeof updateCategorySchema>;

export default function EditCategoryForm({ category }: EditCategoryFormProps) {
  const router = useRouter();
  const updateCategoryMutation = useUpdateCategory();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<UpdateCategoryFormData>({
    resolver: zodResolver(updateCategorySchema),
    defaultValues: {
      name: category.name,
      description: category.description || '',
      isActive: category.isActive,
      wordpress_id: category.wordpress_id,
    },
  });

  const onSubmit = async (data: UpdateCategoryFormData) => {
    setError(null);

    try {
      const payload: UpdateCategoryData = {
        name: data.name,
        description: data.description?.trim() ? data.description : undefined,
        isActive: data.isActive,
        wordpress_id: data.wordpress_id ?? undefined,
      };

      updateCategoryMutation.mutate(
        { id: category.id, data: payload },
        {
          onSuccess: _updatedCategory => {
            // Debug logging removed for production
            toast.success('Category updated successfully!');
            router.push('/inventory/categories');
          },
          onError: error => {
            logger.error('Failed to update category', {
              categoryId: category.id,
              categoryName: data.name,
              error: error instanceof Error ? error.message : String(error),
            });
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'Failed to update category';
            setError(errorMessage);
            toast.error(errorMessage);
          },
          onSettled: () => {
            // Force refetch after mutation completes
            // Debug logging removed for production
          },
        }
      );
    } catch (error) {
      logger.error('Failed to update category', {
        categoryId: category.id,
        categoryName: data.name,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error('Failed to update category');
    }
  };

  const handleCancel = () => {
    router.push('/inventory/categories');
  };

  // Show loading state
  if (updateCategoryMutation.isPending) {
    return (
      <FormLoading
        title="Edit Category"
        description="Update the category information"
        backLabel="Back to Categories"
        onBack={handleCancel}
        backUrl="/inventory/categories"
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="mb-4 px-4 lg:px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Categories
        </Button>
        <PageHeader
          title="Edit Category"
          description={`Update the details for "${category.name}" category`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Information</CardTitle>
          <CardDescription>
            Update the details for this category. Required fields are marked
            with an asterisk (*).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Category Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Category Name
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Electronics, Clothing, Books"
                        {...field}
                        className={
                          form.formState.errors.name ? 'border-red-500' : ''
                        }
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Enter a unique name for this category. This will be used
                      to organize products.
                    </p>
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of this category (optional)"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Optional description to help identify the purpose of this
                      category.
                    </p>
                  </FormItem>
                )}
              />

              {/* WordPress ID */}
              <FormField
                control={form.control}
                name="wordpress_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WordPress ID</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                        onBlur={field.onBlur}
                        value={field.value || ''}
                        placeholder="WordPress category ID (optional)"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Optional WordPress category ID for synchronization.
                    </p>
                  </FormItem>
                )}
              />

              {/* Active Status */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Active categories will be available for product
                        assignment. Inactive categories will be hidden from
                        selection.
                      </p>
                    </div>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormItem>
                )}
              />

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 border-t pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateCategoryMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateCategoryMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {updateCategoryMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {updateCategoryMutation.isPending
                    ? 'Updating...'
                    : 'Update Category'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
