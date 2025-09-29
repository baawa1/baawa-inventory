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
import { SearchableSelect } from '@/components/ui/searchable-select';

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
    <Card className="gap-0">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-base sm:text-lg">
          Category, Brand & Supplier
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
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
                        <span>{formatCategoryHierarchy(category)}</span>
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
                <SearchableSelect
                  value={field.value?.toString() || ''}
                  onChange={value =>
                    field.onChange(value ? parseInt(value) : undefined)
                  }
                  options={brands.map(brand => ({
                    value: brand.id.toString(),
                    label: brand.name,
                  }))}
                  placeholder="Select brand"
                  searchPlaceholder="Search brands..."
                  emptyMessage="No brands found"
                  emptySelectionLabel="No brand"
                  disabled={loading}
                />
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
