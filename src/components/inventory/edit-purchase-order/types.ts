import { z } from "zod";

// Purchase Order entity type
export interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplierId: number;
  userId: number;
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  subtotal: string;
  taxAmount: string;
  shippingCost?: string;
  totalAmount: string;
  status:
    | "draft"
    | "pending"
    | "approved"
    | "ordered"
    | "shipped"
    | "delivered"
    | "cancelled";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  suppliers?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
  };
  users?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

// Validation schema for updating purchase order
export const updatePurchaseOrderSchema = z.object({
  status: z.enum([
    "draft",
    "pending",
    "approved",
    "ordered",
    "shipped",
    "delivered",
    "cancelled",
  ]),
  notes: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  actualDeliveryDate: z.string().optional(),
});

export type UpdatePurchaseOrderFormData = z.infer<
  typeof updatePurchaseOrderSchema
>;
