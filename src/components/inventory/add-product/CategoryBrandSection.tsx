'use client';

import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImagePreview } from '@/components/ui/image-preview';
import { IconTag, IconBrandX } from '@tabler/icons-react';
import type { CreateProductData, Category, Brand, Supplier } from './types';
import { formatCategoryHierarchy } from '@/lib/utils/category';

interface CategoryBrandSectionProps {
  form: UseFormReturn<CreateProductData>;
  categories: Category[];
  brands: Brand[];
  suppliers: Supplier[];
  loading: boolean;
}

export function CategoryBrandSection({
  form,
  categories,
  brands,
  suppliers,
  loading,
}: CategoryBrandSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Category, Brand & Supplier</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <Select
                  disabled={loading}
                  onValueChange={value => field.onChange(parseInt(value))}
                  value={field.value?.toString() || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem
                        key={category.id}
                        value={category.id.toString()}
                      >
                        <div className="flex items-center gap-2">
                          {category.image ? (
                            <ImagePreview
                              src={category.image}
                              alt={category.name}
                              size="sm"
                              className="rounded"
                            />
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-gray-100">
                              <IconTag className="h-3 w-3 text-gray-400" />
                            </div>
                          )}
                          <span>{formatCategoryHierarchy(category)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brandId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <Select
                  disabled={loading}
                  onValueChange={value =>
                    field.onChange(
                      value === 'none' ? undefined : parseInt(value)
                    )
                  }
                  value={field.value?.toString() || 'none'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {brands.map(brand => (
                      <SelectItem key={brand.id} value={brand.id.toString()}>
                        <div className="flex items-center gap-2">
                          {brand.image ? (
                            <ImagePreview
                              src={brand.image}
                              alt={brand.name}
                              size="sm"
                              className="rounded"
                            />
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-gray-100">
                              <IconBrandX className="h-3 w-3 text-gray-400" />
                            </div>
                          )}
                          <span>{brand.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier *</FormLabel>
                <Select
                  disabled={loading}
                  onValueChange={value => field.onChange(parseInt(value))}
                  value={field.value?.toString() || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem
                        key={supplier.id}
                        value={supplier.id.toString()}
                      >
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
