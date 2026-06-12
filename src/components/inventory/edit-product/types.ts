import { z } from 'zod';
import { updateProductSchema } from '@/lib/validations/product';

// Form data type
export type UpdateProductFormData = z.infer<typeof updateProductSchema>;

// Product entity type
export interface EditProduct {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  category?: {
    id: number;
    name: string;
  };
  brand?: {
    id: number;
    name: string;
  };
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  supplier?: {
    id: number;
    name: string;
  };
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  images: Array<{ url: string; isPrimary: boolean }> | null;
  wordpress_id?: number | null;
}

// Reference data types
export interface EditProductCategory {
  id: number;
  name: string;
  parent?:
    | {
        id: number;
        name: string;
      }
    | undefined;
  isActive: boolean;
  productCount: number;
  subcategoryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface EditProductBrand {
  id: number;
  name: string;
}

export interface EditProductSupplier {
  id: number;
  name: string;
}

// Form state types
export interface FormState {
  loading: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  loadingCategories: boolean;
  loadingBrands: boolean;
  loadingSuppliers: boolean;
}

// Form data with reference data
export interface FormData {
  categories: EditProductCategory[];
  brands: EditProductBrand[];
  suppliers: EditProductSupplier[];
  product: EditProduct | null;
}

// Props for the main form component
export interface EditProductFormProps {
  productId: number;
}
