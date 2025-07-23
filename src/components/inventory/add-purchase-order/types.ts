import { z } from "zod";
import { createPurchaseOrderSchema } from "@/lib/validations/purchase-order";

export type CreatePurchaseOrderData = z.infer<typeof createPurchaseOrderSchema>;

export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  cost: number;
  price: number;
  stock: number;
  status: string;
}

export interface FormState {
  loading: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  suppliers: Supplier[];
  products: Product[];
}

// Default form values that match the schema
export const defaultFormValues: CreatePurchaseOrderData = {
  supplierId: 0, // This will be set when user selects a supplier
  orderNumber: "",
  orderDate: new Date().toISOString(), // Set current date as default
  expectedDeliveryDate: "",
  subtotal: 0,
  taxAmount: 0,
  shippingCost: 0,
  totalAmount: 0,
  notes: "",
  items: [],
};
