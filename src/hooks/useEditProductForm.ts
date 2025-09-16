import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProductSchema } from '@/lib/validations/product';
import { useProduct } from '@/hooks/api/products';
import { useCategories } from '@/hooks/api/categories';
import { useBrands } from '@/hooks/api/brands';
import { useSuppliers } from '@/hooks/api/suppliers';
import type { z } from 'zod';

type UpdateProductData = z.infer<typeof updateProductSchema>;

// Improved type definitions
interface FormOption {
  id: number;
  name: string;
}

export interface UseEditProductFormResult {
  form: ReturnType<typeof useForm<UpdateProductData>>;
  product: ProductFormData | undefined;
  categories: FormOption[];
  brands: FormOption[];
  suppliers: FormOption[];
  isLoading: boolean;
  error: string | null;
}

// Align with the Product interface from the API hook
interface ProductFormData {
  id: number;
  name: string;
  description?: string;
  sku: string;
  category?: { id: number; name: string };
  brand?: { id: number; name: string };
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  hasVariants: boolean;
  isArchived: boolean;
  tags: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED';
  supplier?: { id: number; name: string };
  image?: string;
  images?: Array<{ url: string; isPrimary: boolean }>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Custom hook for edit product form that combines all necessary data queries
 * Uses TanStack Query for optimized data fetching with automatic caching and deduplication
 */
export function useEditProductForm(
  productId: number
): UseEditProductFormResult {
  const form = useForm<UpdateProductData>({
    resolver: zodResolver(updateProductSchema),
    defaultValues: {
      name: '',
      description: '',
      sku: '',
      categoryId: undefined,
      brandId: undefined,
      supplierId: undefined,
      purchasePrice: 0,
      sellingPrice: 0,
      currentStock: 0,
      minimumStock: 0,
      status: 'ACTIVE',
      tags: [],
      wordpress_id: undefined,
    },
  });

  // TanStack Query hooks for parallel data fetching
  const product = useProduct(productId);
  const categories = useCategories({ status: 'true' });
  const brands = useBrands({ status: 'true' });
  const suppliers = useSuppliers({ status: 'true' });

  // Combine loading states
  const isLoading =
    product.isLoading ||
    categories.isLoading ||
    brands.isLoading ||
    suppliers.isLoading;

  // Combine error states
  const error =
    product.error?.message ||
    categories.error?.message ||
    brands.error?.message ||
    suppliers.error?.message ||
    null;

  // Populate form when product data is loaded
  useEffect(() => {
    if (product.data) {
      const productData = product.data;
      form.reset({
        name: productData.name,
        description: productData.description || '',
        sku: productData.sku,
        categoryId: productData.category?.id,
        brandId: productData.brand?.id,
        supplierId: productData.supplier?.id,
        purchasePrice: Number(productData.cost),
        sellingPrice: Number(productData.price),
        currentStock: productData.stock,
        minimumStock: productData.minStock,
        status: productData.status,
        tags: productData.tags || [],
        wordpress_id: (productData as any).wordpress_id || undefined,
      });
    }
  }, [product.data, form]);

  return {
    form,
    product: product.data,
    categories: categories.data?.data || [],
    brands: brands.data?.data || [],
    suppliers: suppliers.data?.data || [],
    isLoading,
    error,
  };
}
