import { z } from "zod";
import { idSchema, paginationSchema, searchSchema } from "./common";
import { PURCHASE_ORDER_STATUS } from "@/lib/constants";

// Purchase order item schema
export const purchaseOrderItemSchema = z.object({
  productId: z.number().int().positive().optional(),
  variantId: z.number().int().positive().optional(),
  quantityOrdered: z.coerce.number().int().positive(),
  unitCost: z.coerce.number().positive(),
  totalCost: z.coerce.number().positive(),
});

// Purchase order creation schema
export const createPurchaseOrderSchema = z.object({
  supplierId: idSchema,
  orderNumber: z.string().min(1).max(50),
  orderDate: z.string().datetime(),
  expectedDeliveryDate: z.string().datetime().optional(),
  subtotal: z.coerce.number().positive(),
  taxAmount: z.coerce.number().min(0),
  shippingCost: z.coerce.number().min(0),
  totalAmount: z.coerce.number().positive(),
  notes: z.string().optional(),
  items: z
    .array(purchaseOrderItemSchema)
    .min(1, "At least one item is required"),
});

// Purchase order update schema
export const updatePurchaseOrderSchema = z
  .object({
    supplierId: idSchema.optional(),
    orderNumber: z.string().min(1).max(50).optional(),
    orderDate: z.string().optional(),
    expectedDeliveryDate: z.string().optional(),
    actualDeliveryDate: z.string().optional(),
    subtotal: z.coerce.number().positive().optional(),
    taxAmount: z.coerce.number().min(0).optional(),
    shippingCost: z.coerce.number().min(0).optional(),
    totalAmount: z.coerce.number().positive().optional(),
    status: z
      .enum([
        PURCHASE_ORDER_STATUS.DRAFT,
        PURCHASE_ORDER_STATUS.PENDING,
        PURCHASE_ORDER_STATUS.APPROVED,
        PURCHASE_ORDER_STATUS.ORDERED,
        PURCHASE_ORDER_STATUS.PARTIAL_RECEIVED,
        PURCHASE_ORDER_STATUS.RECEIVED,
        PURCHASE_ORDER_STATUS.CANCELLED,
      ])
      .optional(),
    notes: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// Purchase order query parameters schema
export const purchaseOrderQuerySchema = paginationSchema
  .merge(searchSchema)
  .extend({
    supplierId: z.coerce.number().int().positive().optional(),
    status: z
      .enum([
        PURCHASE_ORDER_STATUS.DRAFT,
        PURCHASE_ORDER_STATUS.PENDING,
        PURCHASE_ORDER_STATUS.APPROVED,
        PURCHASE_ORDER_STATUS.ORDERED,
        PURCHASE_ORDER_STATUS.PARTIAL_RECEIVED,
        PURCHASE_ORDER_STATUS.RECEIVED,
        PURCHASE_ORDER_STATUS.CANCELLED,
      ])
      .optional(),
    fromDate: z.string().datetime().optional(),
    toDate: z.string().datetime().optional(),
    sortBy: z
      .enum(["orderDate", "orderNumber", "totalAmount", "status", "createdAt"])
      .optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  });

// Purchase order ID parameter schema
export const purchaseOrderIdSchema = z.object({
  id: idSchema,
});

// Purchase order item update schema
export const updatePurchaseOrderItemSchema = z.object({
  quantityReceived: z.number().int().min(0),
  notes: z.string().optional(),
});

// Purchase order fulfillment schema
export const fulfillPurchaseOrderSchema = z.object({
  items: z
    .array(
      z.object({
        itemId: idSchema,
        quantityReceived: z.number().int().positive(),
        notes: z.string().optional(),
      })
    )
    .min(1, "At least one item must be fulfilled"),
  actualDeliveryDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// Purchase order status update schema
export const updatePurchaseOrderStatusSchema = z.object({
  status: z.enum([
    PURCHASE_ORDER_STATUS.DRAFT,
    PURCHASE_ORDER_STATUS.PENDING,
    PURCHASE_ORDER_STATUS.APPROVED,
    PURCHASE_ORDER_STATUS.ORDERED,
    PURCHASE_ORDER_STATUS.PARTIAL_RECEIVED,
    PURCHASE_ORDER_STATUS.RECEIVED,
    PURCHASE_ORDER_STATUS.CANCELLED,
  ]),
  notes: z.string().optional(),
});

// Purchase order performance query schema
export const purchaseOrderPerformanceQuerySchema = z.object({
  supplierId: idSchema.optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  includeItems: z.coerce.boolean().optional().default(false),
  includeSupplier: z.coerce.boolean().optional().default(false),
});

// Bulk purchase order operations
export const bulkUpdatePurchaseOrderStatusSchema = z.object({
  purchaseOrderIds: z
    .array(idSchema)
    .min(1, "At least one purchase order ID is required"),
  status: z.enum([
    PURCHASE_ORDER_STATUS.DRAFT,
    PURCHASE_ORDER_STATUS.PENDING,
    PURCHASE_ORDER_STATUS.APPROVED,
    PURCHASE_ORDER_STATUS.ORDERED,
    PURCHASE_ORDER_STATUS.PARTIAL_RECEIVED,
    PURCHASE_ORDER_STATUS.RECEIVED,
    PURCHASE_ORDER_STATUS.CANCELLED,
  ]),
  notes: z.string().optional(),
});

// Purchase order export schema
export const exportPurchaseOrdersSchema = z.object({
  format: z.enum(["csv", "pdf", "excel"]).default("csv"),
  filters: purchaseOrderQuerySchema.optional(),
  includeItems: z.boolean().default(false),
  includeSupplier: z.boolean().default(true),
});

// Purchase order statistics schema
export const purchaseOrderStatisticsSchema = z.object({
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  supplierId: idSchema.optional(),
  groupBy: z.enum(["day", "week", "month", "quarter", "year"]).optional(),
});

// Purchase order validation helpers
export const validatePurchaseOrderTotals = (data: any) => {
  const calculatedTotal =
    data.subtotal + (data.taxAmount || 0) + (data.shippingCost || 0);
  const itemsTotal = data.items.reduce(
    (sum: number, item: any) => sum + item.totalCost,
    0
  );

  return {
    totalsMatch: Math.abs(calculatedTotal - data.totalAmount) < 0.01,
    itemsMatch: Math.abs(itemsTotal - data.subtotal) < 0.01,
    calculatedTotal,
    itemsTotal,
  };
};

// Purchase order status transitions
export const PURCHASE_ORDER_STATUS_TRANSITIONS = {
  [PURCHASE_ORDER_STATUS.DRAFT]: [
    PURCHASE_ORDER_STATUS.ORDERED,
    PURCHASE_ORDER_STATUS.CANCELLED,
  ],
  [PURCHASE_ORDER_STATUS.PENDING]: [
    PURCHASE_ORDER_STATUS.APPROVED,
    PURCHASE_ORDER_STATUS.CANCELLED,
  ],
  [PURCHASE_ORDER_STATUS.APPROVED]: [
    PURCHASE_ORDER_STATUS.ORDERED,
    PURCHASE_ORDER_STATUS.CANCELLED,
  ],
  [PURCHASE_ORDER_STATUS.ORDERED]: [
    PURCHASE_ORDER_STATUS.PARTIAL_RECEIVED,
    PURCHASE_ORDER_STATUS.RECEIVED,
    PURCHASE_ORDER_STATUS.CANCELLED,
  ],
  [PURCHASE_ORDER_STATUS.PARTIAL_RECEIVED]: [
    PURCHASE_ORDER_STATUS.RECEIVED,
    PURCHASE_ORDER_STATUS.CANCELLED,
  ],
  [PURCHASE_ORDER_STATUS.RECEIVED]: [], // Final state
  [PURCHASE_ORDER_STATUS.CANCELLED]: [], // Final state
} as const;

export const validateStatusTransition = (
  currentStatus: string,
  newStatus: string
): boolean => {
  const allowedTransitions =
    PURCHASE_ORDER_STATUS_TRANSITIONS[
      currentStatus as keyof typeof PURCHASE_ORDER_STATUS_TRANSITIONS
    ] || [];
  return allowedTransitions.includes(newStatus as never);
};

// Purchase order business rules
export const PURCHASE_ORDER_RULES = {
  MAX_ITEMS_PER_ORDER: 100,
  MAX_TOTAL_AMOUNT: 10000000, // 10 million Naira
  MIN_ORDER_AMOUNT: 100, // 100 Naira
  MAX_QUANTITY_PER_ITEM: 10000,
  MIN_QUANTITY_PER_ITEM: 1,
} as const;

export const validatePurchaseOrderRules = (data: any) => {
  const errors: string[] = [];

  if (data.items.length > PURCHASE_ORDER_RULES.MAX_ITEMS_PER_ORDER) {
    errors.push(
      `Maximum ${PURCHASE_ORDER_RULES.MAX_ITEMS_PER_ORDER} items allowed per order`
    );
  }

  if (data.totalAmount > PURCHASE_ORDER_RULES.MAX_TOTAL_AMOUNT) {
    errors.push(
      `Maximum order amount is ₦${PURCHASE_ORDER_RULES.MAX_TOTAL_AMOUNT.toLocaleString()}`
    );
  }

  if (data.totalAmount < PURCHASE_ORDER_RULES.MIN_ORDER_AMOUNT) {
    errors.push(
      `Minimum order amount is ₦${PURCHASE_ORDER_RULES.MIN_ORDER_AMOUNT}`
    );
  }

  for (const item of data.items) {
    if (item.quantityOrdered > PURCHASE_ORDER_RULES.MAX_QUANTITY_PER_ITEM) {
      errors.push(
        `Maximum quantity per item is ${PURCHASE_ORDER_RULES.MAX_QUANTITY_PER_ITEM}`
      );
    }

    if (item.quantityOrdered < PURCHASE_ORDER_RULES.MIN_QUANTITY_PER_ITEM) {
      errors.push(
        `Minimum quantity per item is ${PURCHASE_ORDER_RULES.MIN_QUANTITY_PER_ITEM}`
      );
    }
  }

  return errors;
};
