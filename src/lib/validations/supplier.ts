import { z } from "zod";
import {
  idSchema,
  paginationSchema,
  searchSchema,
  emailSchema,
  phoneSchema,
  nameSchema,
} from "./common";

// Supplier creation schema
export const createSupplierSchema = z.object({
  name: nameSchema,
  contactPerson: z
    .string()
    .max(255, "Contact person name must be 255 characters or less")
    .optional()
    .nullable(),
  email: emailSchema.optional().nullable(),
  phone: phoneSchema,
  address: z
    .string()
    .max(500, "Address must be 500 characters or less")
    .optional()
    .nullable(),
  city: z
    .string()
    .max(100, "City must be 100 characters or less")
    .optional()
    .nullable(),
  state: z
    .string()
    .max(100, "State must be 100 characters or less")
    .optional()
    .nullable(),
  country: z
    .string()
    .max(100, "Country must be 100 characters or less")
    .optional()
    .nullable(),
  postalCode: z
    .string()
    .max(20, "Postal code must be 20 characters or less")
    .optional()
    .nullable(),
  taxId: z
    .string()
    .max(50, "Tax ID must be 50 characters or less")
    .optional()
    .nullable(),
  paymentTerms: z
    .string()
    .max(255, "Payment terms must be 255 characters or less")
    .optional()
    .nullable(),
  creditLimit: z
    .number()
    .positive("Credit limit must be positive")
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
  notes: z
    .string()
    .max(1000, "Notes must be 1000 characters or less")
    .optional()
    .nullable(),
});

// Supplier update schema (all fields optional except validation rules)
export const updateSupplierSchema = createSupplierSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// Supplier query parameters schema
export const supplierQuerySchema = paginationSchema.merge(searchSchema).extend({
  isActive: z.coerce.boolean().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

// Supplier ID parameter schema
export const supplierIdSchema = z.object({
  id: idSchema,
});

// Supplier performance schema (for reporting)
export const supplierPerformanceQuerySchema = z.object({
  supplierId: idSchema,
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  includeProducts: z.coerce.boolean().optional().default(false),
  includePurchaseOrders: z.coerce.boolean().optional().default(false),
});

// Bulk supplier operations
export const bulkUpdateSupplierStatusSchema = z.object({
  supplierIds: z.array(idSchema).min(1, "At least one supplier ID is required"),
  isActive: z.boolean(),
});
