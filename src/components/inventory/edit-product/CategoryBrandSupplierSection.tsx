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
import { ImagePreview } from '@/components/ui/image-preview';
import { IconTag, IconBrandX } from '@tabler/icons-react';
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
                          <div className="flex items-center gap-2">
                            {category.image &&
                            category.image.startsWith('http') &&
                            !category.image.includes('unsplash.com') ? (
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
                  onValueChange={value =>
                    field.onChange(value ? parseInt(value) : undefined)
                  }
                  value={field.value?.toString() || ''}
                  disabled={loadingBrands}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingBrands ? (
                            <div className="flex items-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading...
                            </div>
                          ) : (
                            'Select brand'
                          )
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.isArray(brands) &&
                      brands.map(brand => (
                        <SelectItem key={brand.id} value={brand.id.toString()}>
                          <div className="flex items-center gap-2">
                            {brand.image &&
                            brand.image.startsWith('http') &&
                            !brand.image.includes('unsplash.com') ? (
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
