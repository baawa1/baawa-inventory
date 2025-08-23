import { z } from 'zod';
import {
  idSchema,
  paginationSchema,
  searchSchema,
  productStatusSchema,
  stockSchema,
  skuSchema,
  nameSchema,
} from './common';
import { nairaPriceSchema, costPriceSchema } from './price';

// Product creation schema
export const createProductSchema = z.object({
  name: nameSchema,
  sku: skuSchema.optional(), // Made optional since it will be auto-generated
  barcode: z.string().optional().nullable(),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional()
    .nullable(),
  categoryId: z
    .number()
    .int()
    .positive('Category is required')
    .optional()
    .nullable(),
  brandId: z
    .number()
    .int()
    .positive('Brand must be a valid ID')
    .optional()
    .nullable(),
  purchasePrice: costPriceSchema.optional(),
  sellingPrice: nairaPriceSchema.optional(),
  minimumStock: stockSchema,
  maximumStock: stockSchema.optional().nullable(),
  currentStock: stockSchema,
  supplierId: idSchema.optional().nullable(),
  status: productStatusSchema,
  notes: z
    .string()
    .max(500, 'Notes must be 500 characters or less')
    .optional()
    .nullable(),
  // New fields
  unit: z.string().max(20, 'Unit must be 20 characters or less').optional(),
  weight: z.number().positive('Weight must be positive').optional().nullable(),
  dimensions: z
    .string()
    .max(100, 'Dimensions must be 100 characters or less')
    .optional()
    .nullable(),
  color: z
    .string()
    .max(50, 'Color must be 50 characters or less')
    .optional()
    .nullable(),
  size: z
    .string()
    .max(50, 'Size must be 50 characters or less')
    .optional()
    .nullable(),
  material: z
    .string()
    .max(100, 'Material must be 100 characters or less')
    .optional()
    .nullable(),
  tags: z.array(z.string()).optional(),
});

// Product update schema (all fields optional except validation rules)
export const updateProductSchema = createProductSchema
  .partial()
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

// Product query parameters schema
export const productQuerySchema = paginationSchema.merge(searchSchema).extend({
  category: z.string().optional(),
  brand: z.string().optional(),
  status: productStatusSchema.optional(),
  supplierId: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  lowStock: z.coerce.boolean().optional(),
  outOfStock: z.coerce.boolean().optional(),
});

// Product ID parameter schema
export const productIdSchema = z.object({
  id: idSchema,
});

// Stock update schema
export const stockUpdateSchema = z.object({
  quantity: z.number().int(),
  reason: z
    .string()
    .min(1, 'Reason is required')
    .max(255, 'Reason must be 255 characters or less'),
});

// Bulk operation schemas
export const bulkUpdatePricesSchema = z.object({
  productIds: z.array(idSchema).min(1, 'At least one product ID is required'),
  priceAdjustment: z.object({
    type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    value: z.number(),
    applyTo: z.enum(['PURCHASE_PRICE', 'SELLING_PRICE', 'BOTH']),
  }),
});

export const bulkUpdateStatusSchema = z.object({
  productIds: z.array(idSchema).min(1, 'At least one product ID is required'),
  status: productStatusSchema,
});

// Validation for product search with category aggregation
export const productSearchWithStatsSchema = productQuerySchema.extend({
  includeStats: z.coerce.boolean().optional().default(false),
  categoryStats: z.coerce.boolean().optional().default(false),
});
