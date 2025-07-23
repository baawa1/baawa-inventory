import { z } from "zod";
import { PURCHASE_ORDER_STATUS } from "@/lib/constants";
import { updatePurchaseOrderSchema } from "@/lib/validations/purchase-order";

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
  status: (typeof PURCHASE_ORDER_STATUS)[keyof typeof PURCHASE_ORDER_STATUS];
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
  purchaseOrderItems?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: number;
  purchaseOrderId: number;
  productId?: number;
  variantId?: number;
  quantityOrdered: number;
  quantityReceived?: number;
  unitCost: string;
  totalCost: string;
  products?: {
    id: number;
    name: string;
    sku: string;
  };
  productVariants?: {
    id: number;
    name: string;
    sku: string;
  };
}

// Comprehensive form data type for editing all purchase order fields
export type UpdatePurchaseOrderFormData = z.infer<
  typeof updatePurchaseOrderSchema
>;

// Form option type for dropdowns
export interface FormOption {
  value: string;
  label: string;
}
