import { z } from 'zod';

// Base brand schema
const baseBrandSchema = z.object({
  name: z
    .string()
    .min(1, 'Brand name is required')
    .max(100, 'Brand name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
  website: z
    .string()
    .url('Please enter a valid website URL')
    .optional()
    .nullable()
    .or(z.literal('')),
  isActive: z.boolean().optional().default(true),
  wordpress_id: z.number().int().positive('WordPress ID must be a positive integer').max(2147483647, 'WordPress ID must be less than 2,147,483,647').optional().nullable(),
});

// Client-side form schema (uses isActive consistently with Prisma model)
const clientBrandSchema = z.object({
  name: z
    .string()
    .min(1, 'Brand name is required')
    .max(100, 'Brand name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
  website: z
    .string()
    .url('Please enter a valid website URL')
    .optional()
    .nullable()
    .or(z.literal('')),
  isActive: z.boolean(),
  wordpress_id: z.number().int().positive('WordPress ID must be a positive integer').max(2147483647, 'WordPress ID must be less than 2,147,483,647').optional().nullable(),
});

// Create brand schema
export const createBrandSchema = baseBrandSchema;

// Update brand schema
export const updateBrandSchema = baseBrandSchema.partial().extend({
  id: z.number().int().positive('Brand ID must be a positive integer'),
});

// Client-side form schemas
export const createBrandFormSchema = clientBrandSchema;
export const updateBrandFormSchema = clientBrandSchema.partial().extend({
  id: z.number().int().positive('Brand ID must be a positive integer'),
});

// Brand ID schema for URL params
export const brandIdSchema = z.object({
  id: z.string().transform(val => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed <= 0) {
      throw new Error('Brand ID must be a positive integer');
    }
    return parsed;
  }),
});

// Brand query schema for listing/filtering
export const brandQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z
    .union([z.boolean(), z.string().transform(val => val === 'true')])
    .optional(),
  limit: z.number().int().min(1).max(100).default(10),
  offset: z.number().int().min(0).default(0),
  sortBy: z
    .enum(['name', 'createdAt', 'updatedAt', 'productCount'])
    .default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Type exports
export type CreateBrandData = z.infer<typeof createBrandSchema>;
export type UpdateBrandData = z.infer<typeof updateBrandSchema>;
export type CreateBrandFormData = z.infer<typeof createBrandFormSchema>;
export type UpdateBrandFormData = z.infer<typeof updateBrandFormSchema>;
export type BrandIdParams = z.infer<typeof brandIdSchema>;
export type BrandQueryParams = z.infer<typeof brandQuerySchema>;
