import { z } from 'zod';
import {
  idSchema,
  paginationSchema,
  searchSchema,
  emailSchema,
  phoneSchema,
  nameSchema,
} from './common';

// Base supplier schema for forms
export const supplierFormSchema = z.object({
  name: nameSchema.optional(),
  contactPerson: z.string().optional().nullable(),
  email: emailSchema.optional().nullable(),
  phone: phoneSchema.optional().nullable(),
  address: z
    .string()
    .max(500, 'Address must be 500 characters or less')
    .optional()
    .nullable(),
  city: z
    .string()
    .max(100, 'City must be 100 characters or less')
    .optional()
    .nullable(),
  state: z
    .string()
    .max(100, 'State must be 100 characters or less')
    .optional()
    .nullable(),
  website: z
    .string()
    .url('Website must be a valid URL')
    .max(255, 'Website must be 255 characters or less')
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(1000, 'Notes must be 1000 characters or less')
    .optional()
    .nullable(),
});

// Supplier creation schema (requires name)
export const createSupplierSchema = supplierFormSchema.extend({
  name: nameSchema,
});

// Supplier update schema (all fields optional except validation rules)
export const updateSupplierSchema = supplierFormSchema
  .extend({
    id: idSchema,
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

// Type for update form data
export type UpdateSupplierFormData = z.infer<typeof updateSupplierSchema>;

// Supplier query parameters schema
export const supplierQuerySchema = paginationSchema.merge(searchSchema).extend({
  city: z.string().optional(),
  state: z.string().optional(),
});

// Supplier ID parameter schema
export const supplierIdSchema = z.object({
  id: z.string().transform(val => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed <= 0) {
      throw new Error('Supplier ID must be a positive integer');
    }
    return parsed;
  }),
});

// Supplier performance schema (for reporting)
export const supplierPerformanceQuerySchema = z.object({
  supplierId: idSchema,
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  includeProducts: z.coerce.boolean().optional().default(false),
});

// Bulk supplier operations (removed since isActive field no longer exists)
