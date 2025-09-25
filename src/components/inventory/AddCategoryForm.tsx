'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

// Hooks
import {
  useCreateCategory,
  useTopLevelCategories,
  type CreateCategoryData,
} from '@/hooks/api/categories';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

import { PageHeader } from '@/components/ui/page-header';
import { FormLoading } from '@/components/ui/form-loading';

// Icons
import { ArrowLeft, Loader2 } from 'lucide-react';
import { IconFolder } from '@tabler/icons-react';
import { logger } from '@/lib/logger';

const formSchema = z.object({
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
  parentId: z.number().nullable().optional(),
  wordpress_id: z.number().int().positive('WordPress ID must be a positive integer').nullable().optional(),
});

type CreateCategoryFormData = z.infer<typeof formSchema>;

export default function AddCategoryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentIdFromUrl = searchParams.get('parentId');

  const [error, setError] = useState<string | null>(null);

  const createCategoryMutation = useCreateCategory();
  const { data: parentCategoriesData } = useTopLevelCategories();

  const form = useForm<CreateCategoryFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
      wordpress_id: null,
    },
  });

  // Set parentId from URL params after form initialization
  React.useEffect(() => {
    if (parentIdFromUrl) {
      form.setValue('parentId', parseInt(parentIdFromUrl));
    }
  }, [parentIdFromUrl, form]);

  const onSubmit = async (data: CreateCategoryFormData) => {
    setError(null);

    try {
      const payload = {
        name: data.name,
        description: data.description?.trim() ? data.description : undefined,
        isActive: data.isActive,
        parentId: data.parentId ?? undefined,
        wordpress_id: data.wordpress_id ?? undefined,
      } satisfies CreateCategoryData;

      createCategoryMutation.mutate(
        payload,
        {
          onSuccess: _createdCategory => {
            // Debug logging removed for production
            toast.success('Category created successfully!');
            router.push('/inventory/categories');
          },
          onError: error => {
            logger.error('Failed to create category', {
              categoryName: data.name,
              error: error instanceof Error ? error.message : String(error),
            });
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'Failed to create category';
            setError(errorMessage);
            toast.error(errorMessage);
          },
        }
      );
    } catch (error) {
      logger.error('Failed to create category', {
        categoryName: data.name,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error('Failed to create category');
    }
  };

  const handleCancel = () => {
    router.push('/inventory/categories');
  };

  // Show loading state
  if (createCategoryMutation.isPending) {
    return (
      <FormLoading
        title="Add Category"
        description="Create a new product category to organize your inventory"
        backLabel="Back to Categories"
        onBack={() => router.push('/inventory/categories')}
        backUrl="/inventory/categories"
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-3 sm:space-y-6 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="mb-3 px-3 sm:mb-4 sm:px-4 lg:px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Categories
        </Button>
        <PageHeader
          title="Add Category"
          description="Create a new product category to organize your inventory"
        />
      </div>

      <Card>
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Category Information</CardTitle>
          <CardDescription className="text-sm">
            Enter the details for the new category. Required fields are marked
            with an asterisk (*).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Category Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        value={field.value}
                        placeholder="Enter category name"
                        className={
                          form.formState.errors.name ? 'border-destructive' : ''
                        }
                        disabled={createCategoryMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Category</FormLabel>
                    <Select
                      onValueChange={value =>
                        field.onChange(
                          value === 'none' ? null : parseInt(value)
                        )
                      }
                      defaultValue={field.value?.toString() || 'none'}
                      disabled={createCategoryMutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent category (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">
                          <div className="flex items-center space-x-2">
                            <IconFolder className="h-4 w-4" />
                            <span>No parent (Top-level category)</span>
                          </div>
                        </SelectItem>
                        {parentCategoriesData?.data?.map(category => (
                          <SelectItem
                            key={category.id}
                            value={category.id.toString()}
                          >
                            <div className="flex items-center space-x-2">
                              <IconFolder className="h-4 w-4" />
                              <span>{category.name}</span>
                              {category.subcategoryCount > 0 && (
                                <span className="text-muted-foreground text-xs">
                                  ({category.subcategoryCount} subcategories)
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    <p className="text-muted-foreground text-xs">
                      Leave empty to create a top-level category, or select a
                      parent to create a subcategory
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        value={field.value}
                        placeholder="Enter category description (optional)"
                        rows={3}
                        className={
                          form.formState.errors.description
                            ? 'border-destructive'
                            : ''
                        }
                        disabled={createCategoryMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        disabled={createCategoryMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel htmlFor="isActive" className="text-base">
                        Active Status
                      </FormLabel>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Active categories will be available for product
                        assignment.
                      </p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={createCategoryMutation.isPending}
                    />
                  </FormItem>
                )}
              />

              {/* Error Display */}
              {error && (
                <div className="border-destructive bg-destructive/10 rounded-md border p-4">
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              )}

              <div className="flex items-center gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={createCategoryMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {createCategoryMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {createCategoryMutation.isPending
                    ? 'Creating...'
                    : 'Create Category'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={createCategoryMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
