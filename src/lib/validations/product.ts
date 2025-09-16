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
  sellingPrice: nairaPriceSchema,
  minimumStock: stockSchema,
  currentStock: stockSchema,
  supplierId: idSchema.optional().nullable(),
  status: productStatusSchema,
  tags: z.array(z.string()).optional(),
  wordpress_id: z.union([
    z.number().int().positive('WordPress ID must be a positive integer').max(2147483647, 'WordPress ID must be less than 2,147,483,647'),
    z.null(),
    z.undefined()
  ]).optional(),
  // Image support
  images: z.array(z.object({
    url: z.string().url('Image URL must be valid'),
    filename: z.string().min(1, 'Filename is required'),
    mimeType: z.string().min(1, 'MIME type is required'),
    alt: z.string().optional(),
    isPrimary: z.boolean(),
    uploadedAt: z.string(),
    size: z.number(),
  })),
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
