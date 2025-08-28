import { z } from 'zod';
import {
  idSchema,
  paginationSchema,
  searchSchema,
  dateRangeSchema,
  paymentMethodSchema,
  paymentStatusSchema,
  priceSchema,
} from './common';

// Sale item schema for creating sales
export const saleItemSchema = z.object({
  productId: idSchema,
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: priceSchema,
  discount: z
    .number()
    .min(0, 'Discount cannot be negative')
    .max(100, 'Discount cannot exceed 100%')
    .default(0),
});

// Sale creation schema
export const createSaleSchema = z
  .object({
    userId: idSchema,
    items: z.array(saleItemSchema).min(1, 'At least one item is required'),
    paymentMethod: paymentMethodSchema,
    paymentStatus: paymentStatusSchema.default('PENDING'),
    discountAmount: z
      .number()
      .min(0, 'Discount amount cannot be negative')
      .default(0),
    taxAmount: z.number().min(0, 'Tax amount cannot be negative').default(0),
    notes: z
      .string()
      .max(500, 'Notes must be 500 characters or less')
      .optional()
      .nullable(),
    wordpress_id: z.number().int().positive('WordPress ID must be a positive integer').optional().nullable(),
  })
  .refine(
    data => {
      // Calculate total from items
      const itemsTotal = data.items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.unitPrice;
        const discountedTotal = itemTotal * (1 - item.discount / 100);
        return sum + discountedTotal;
      }, 0);

      // Validate that discount doesn't exceed items total
      return data.discountAmount <= itemsTotal;
    },
    {
      message: 'Discount amount cannot exceed items total',
      path: ['discountAmount'],
    }
  );

// Sale update schema (limited fields that can be updated)
export const updateSaleSchema = z
  .object({
    paymentStatus: paymentStatusSchema.optional(),
    notes: z
      .string()
      .max(500, 'Notes must be 500 characters or less')
      .optional()
      .nullable(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

// Sale query parameters schema
export const saleQuerySchema = paginationSchema
  .merge(searchSchema)
  .merge(dateRangeSchema)
  .extend({
    userId: z.coerce.number().int().positive().optional(),
    paymentMethod: paymentMethodSchema.optional(),
    paymentStatus: paymentStatusSchema.optional(),
    minTotal: z.coerce.number().positive().optional(),
    maxTotal: z.coerce.number().positive().optional(),
  });

// Sale ID parameter schema
export const saleIdSchema = z.object({
  id: idSchema,
});

// Sale refund schema
export const refundSaleSchema = z.object({
  reason: z
    .string()
    .min(1, 'Refund reason is required')
    .max(500, 'Reason must be 500 characters or less'),
  refundAmount: priceSchema.optional(), // If not provided, refund full amount
  items: z
    .array(
      z.object({
        saleItemId: idSchema,
        quantity: z.number().int().positive('Quantity must be positive'),
      })
    )
    .optional(), // For partial refunds
});

// Sale receipt schema
export const saleReceiptSchema = z.object({
  saleId: idSchema,
  customerEmail: z.string().email('Invalid email format').optional(),
  includeItemDetails: z.boolean().default(true),
});

// Sales report schema
export const salesReportSchema = dateRangeSchema.extend({
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
  userId: z.coerce.number().int().positive().optional(),
  paymentMethod: paymentMethodSchema.optional(),
  includeItems: z.coerce.boolean().optional().default(false),
});

// Daily sales summary schema
export const dailySalesSummarySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  userId: z.coerce.number().int().positive().optional(),
});
