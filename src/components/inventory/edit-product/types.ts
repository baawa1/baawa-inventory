import { z } from 'zod';
import { updateProductSchema } from '@/lib/validations/product';

// Form data type
export type UpdateProductFormData = z.infer<typeof updateProductSchema>;

// Product entity type
export interface Product {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  barcode: string | null;
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
  maxStock: number | null;
  supplierId: number;
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED';
  images: Array<{ url: string; isPrimary: boolean }> | null;
}

// Reference data types
export interface Category {
  id: number;
  name: string;
  image?: string | undefined;
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

export interface Brand {
  id: number;
  name: string;
  image?: string | null;
}

export interface Supplier {
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
  categories: Category[];
  brands: Brand[];
  suppliers: Supplier[];
  product: Product | null;
}

// Props for the main form component
export interface EditProductFormProps {
  productId: number;
}
