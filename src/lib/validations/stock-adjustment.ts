import { z } from "zod";
import {
  idSchema,
  paginationSchema,
  searchSchema,
  dateRangeSchema,
  stockAdjustmentTypeSchema,
} from "./common";

// Stock adjustment creation schema
export const createStockAdjustmentSchema = z
  .object({
    productId: idSchema,
    type: stockAdjustmentTypeSchema,
    quantity: z
      .number()
      .int()
      .refine((val) => val !== 0, {
        message: "Quantity cannot be zero",
      }),
    reason: z
      .string()
      .min(1, "Reason is required")
      .max(500, "Reason must be 500 characters or less"),
    userId: idSchema,
    notes: z
      .string()
      .max(1000, "Notes must be 1000 characters or less")
      .optional()
      .nullable(),
    referenceNumber: z
      .string()
      .max(100, "Reference number must be 100 characters or less")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // For certain types, quantity should be positive or negative
      const increaseTypes = ["INCREASE", "RETURN"];
      const decreaseTypes = ["DECREASE", "DAMAGE", "TRANSFER"];

      if (increaseTypes.includes(data.type) && data.quantity <= 0) {
        return false;
      }

      if (decreaseTypes.includes(data.type) && data.quantity >= 0) {
        return false;
      }

      return true;
    },
    {
      message: "Quantity sign must match adjustment type",
      path: ["quantity"],
    }
  );

// Stock adjustment update schema (limited fields)
export const updateStockAdjustmentSchema = z
  .object({
    reason: z
      .string()
      .min(1, "Reason is required")
      .max(500, "Reason must be 500 characters or less")
      .optional(),
    notes: z
      .string()
      .max(1000, "Notes must be 1000 characters or less")
      .optional()
      .nullable(),
    referenceNumber: z
      .string()
      .max(100, "Reference number must be 100 characters or less")
      .optional()
      .nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// Stock adjustment query parameters schema
export const stockAdjustmentQuerySchema = paginationSchema
  .merge(searchSchema)
  .merge(dateRangeSchema)
  .extend({
    productId: z.coerce.number().int().positive().optional(),
    userId: z.coerce.number().int().positive().optional(),
    type: stockAdjustmentTypeSchema.optional(),
    referenceNumber: z.string().optional(),
  });

// Stock adjustment ID parameter schema
export const stockAdjustmentIdSchema = z.object({
  id: idSchema,
});

// Bulk stock adjustment schema
export const bulkStockAdjustmentSchema = z.object({
  adjustments: z
    .array(createStockAdjustmentSchema)
    .min(1, "At least one adjustment is required"),
  batchReason: z
    .string()
    .max(500, "Batch reason must be 500 characters or less")
    .optional(),
  batchReference: z
    .string()
    .max(100, "Batch reference must be 100 characters or less")
    .optional(),
});

// Stock recount schema (for inventory counting)
export const stockRecountSchema = z.object({
  items: z
    .array(
      z.object({
        productId: idSchema,
        countedQuantity: z
          .number()
          .int()
          .min(0, "Counted quantity cannot be negative"),
        notes: z
          .string()
          .max(500, "Notes must be 500 characters or less")
          .optional()
          .nullable(),
      })
    )
    .min(1, "At least one item is required"),
  userId: idSchema,
  reason: z
    .string()
    .min(1, "Reason is required")
    .max(500, "Reason must be 500 characters or less"),
  referenceNumber: z
    .string()
    .max(100, "Reference number must be 100 characters or less")
    .optional(),
});

// Stock movement report schema
export const stockMovementReportSchema = dateRangeSchema.extend({
  productId: z.coerce.number().int().positive().optional(),
  type: stockAdjustmentTypeSchema.optional(),
  userId: z.coerce.number().int().positive().optional(),
  groupBy: z.enum(["product", "type", "user", "day"]).optional(),
});

// Low stock alert schema
export const lowStockAlertSchema = z.object({
  threshold: z
    .number()
    .int()
    .min(0, "Threshold cannot be negative")
    .default(10),
  includeOutOfStock: z.boolean().default(true),
  category: z.string().optional(),
  supplierId: z.coerce.number().int().positive().optional(),
});
