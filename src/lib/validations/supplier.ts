import { z } from 'zod';
import {
  idSchema,
  paginationSchema,
  searchSchema,
  emailSchema,
  phoneSchema,
  nameSchema,
} from './common';

const normalizeOptionalField = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    value => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    schema.optional().nullable()
  );

// Base supplier schema for forms
export const supplierFormSchema = z.object({
  name: nameSchema.optional(),
  contactPerson: normalizeOptionalField(z.string()),
  email: normalizeOptionalField(emailSchema),
  phone: normalizeOptionalField(phoneSchema),
  address: normalizeOptionalField(
    z.string().max(500, 'Address must be 500 characters or less')
  ),
  city: normalizeOptionalField(
    z.string().max(100, 'City must be 100 characters or less')
  ),
  state: normalizeOptionalField(
    z.string().max(100, 'State must be 100 characters or less')
  ),
  website: normalizeOptionalField(
    z.string().url('Website must be a valid URL').max(255, 'Website must be 255 characters or less')
  ),
  notes: normalizeOptionalField(
    z.string().max(1000, 'Notes must be 1000 characters or less')
  ),
});

const applyUpdateFieldRequirement = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((data, ctx) => {
  const hasAtLeastOneField = Object.entries(data).some(([, value]) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== undefined && value !== null && value !== '';
  });

  if (!hasAtLeastOneField) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one field must be provided for update',
      path: [],
    });
  }
  });

// Supplier creation schema (requires name)
export const createSupplierSchema = supplierFormSchema.extend({
  name: nameSchema,
});

// Supplier update schema (all fields optional except validation rules)
export const updateSupplierBodySchema = applyUpdateFieldRequirement(
  supplierFormSchema
);

export const updateSupplierSchema = applyUpdateFieldRequirement(
  supplierFormSchema.extend({
    id: idSchema,
  })
);

// Inferred types from schemas
export type SupplierFormData = z.infer<typeof supplierFormSchema>;
export type CreateSupplierFormData = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierFormData = z.infer<typeof updateSupplierSchema>;
export type UpdateSupplierBodyData = z.infer<typeof updateSupplierBodySchema>;

// Database supplier interface (matches Prisma schema)
export interface Supplier {
  id: number;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

// API response type for suppliers
export interface ApiSupplier extends Omit<Supplier, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string | null;
  _count?: {
    products: number;
  };
}

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
