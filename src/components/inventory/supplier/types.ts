import { z } from "zod";
import {
  updateSupplierSchema,
  createSupplierSchema,
} from "@/lib/validations/supplier";

export type SupplierFormData = z.infer<typeof updateSupplierSchema>;
export type CreateSupplierData = z.infer<typeof createSupplierSchema>;

export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  taxNumber?: string | null;
  paymentTerms?: string | null;
  creditLimit?: number | null;
  isActive: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export interface FormState {
  loading: boolean;
  isSubmitting: boolean;
  submitError: string | null;
}

export interface EditSupplierModalProps {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (_supplier: Supplier) => void;
}
