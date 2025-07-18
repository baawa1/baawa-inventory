import type { z } from "zod";
import { createProductSchema } from "@/lib/validations/product";

export type CreateProductData = z.infer<typeof createProductSchema>;

export interface Category {
  id: number;
  name: string;
  image?: string | null;
  parent?: {
    id: number;
    name: string;
  } | null;
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
  email?: string;
  phone?: string;
}

export interface FormState {
  loading: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  categories: Category[];
  brands: Brand[];
  suppliers: Supplier[];
}

// Default form values that match the schema
export const defaultFormValues: CreateProductData = {
  name: "",
  sku: "",
  barcode: null,
  description: null,
  categoryId: null,
  brandId: null,
  purchasePrice: 0,
  sellingPrice: 0,
  minimumStock: 0,
  currentStock: 0,
  maximumStock: null,
  supplierId: null,
  status: "active",
  imageUrl: null,
  notes: null,
};
