import React from 'react';
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
import { Loader2 } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';

import { UpdateProductFormData, Category, Brand, Supplier } from './types';
import { formatCategoryHierarchy } from '@/lib/utils/category';

interface CategoryBrandSupplierSectionProps {
  form: UseFormReturn<UpdateProductFormData>;
  categories: Category[];
  brands: Brand[];
  suppliers: Supplier[];
  loadingCategories: boolean;
  loadingBrands: boolean;
  loadingSuppliers: boolean;
}

export function CategoryBrandSupplierSection({
  form,
  categories,
  brands,
  suppliers,
  loadingCategories,
  loadingBrands,
  loadingSuppliers,
}: CategoryBrandSupplierSectionProps) {
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
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={value =>
                    field.onChange(value ? parseInt(value) : undefined)
                  }
                  value={field.value?.toString() || ''}
                  disabled={loadingCategories}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingCategories ? (
                            <div className="flex items-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading...
                            </div>
                          ) : (
                            'Select category'
                          )
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.isArray(categories) &&
                      categories.map(category => (
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
                  options={Array.isArray(brands)
                    ? brands.map(brand => ({
                        value: brand.id.toString(),
                        label: brand.name,
                      }))
                    : []}
                  placeholder={
                    loadingBrands ? 'Loading brands...' : 'Select brand'
                  }
                  searchPlaceholder="Search brands..."
                  emptyMessage="No brands found"
                  emptySelectionLabel="No brand"
                  disabled={loadingBrands}
                  triggerClassName={
                    loadingBrands ? 'opacity-75 pointer-events-none' : undefined
                  }
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
                <FormLabel>Supplier</FormLabel>
                <Select
                  onValueChange={value =>
                    field.onChange(value ? parseInt(value) : undefined)
                  }
                  value={field.value?.toString() || ''}
                  disabled={loadingSuppliers}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingSuppliers ? (
                            <div className="flex items-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading...
                            </div>
                          ) : (
                            'Select supplier'
                          )
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.isArray(suppliers) &&
                      suppliers.map(supplier => (
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
