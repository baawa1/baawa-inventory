import { z } from "zod";

// Common validation schemas
export const idSchema = z.number().int().positive();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const searchSchema = z.object({
  search: z.string().optional(),
});

export const dateRangeSchema = z.object({
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

// Enum schemas based on Prisma schema
export const userRoleSchema = z.enum(["ADMIN", "MANAGER", "STAFF"]);

export const userStatusSchema = z.enum([
  "PENDING",
  "VERIFIED",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
]);

export const productStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "OUT_OF_STOCK",
  "DISCONTINUED",
]);

export const paymentMethodSchema = z.enum([
  "CASH",
  "BANK_TRANSFER",
  "POS_MACHINE",
  "CREDIT_CARD",
  "MOBILE_MONEY",
]);

export const paymentStatusSchema = z.enum([
  "PENDING",
  "PAID",
  "REFUNDED",
  "CANCELLED",
]);

export const stockAdjustmentTypeSchema = z.enum([
  "INCREASE",
  "DECREASE",
  "RECOUNT",
  "DAMAGE",
  "TRANSFER",
  "RETURN",
]);

export const purchaseOrderStatusSchema = z.enum([
  "PENDING",
  "ORDERED",
  "PARTIAL_RECEIVED",
  "RECEIVED",
  "CANCELLED",
]);

// Common field validations
export const emailSchema = z.string().email("Invalid email format");

export const phoneSchema = z
  .string()
  .regex(/^[\+]?[1-9][\d]{0,15}$/, "Invalid phone number format")
  .optional();

export const priceSchema = z
  .number()
  .positive("Price must be positive")
  .multipleOf(0.01, "Price must have at most 2 decimal places");

export const stockSchema = z
  .number()
  .int("Stock must be a whole number")
  .min(0, "Stock cannot be negative");

export const skuSchema = z
  .string()
  .min(1, "SKU is required")
  .max(50, "SKU must be 50 characters or less")
  .regex(
    /^[A-Z0-9\-_]+$/i,
    "SKU can only contain letters, numbers, hyphens, and underscores"
  );

export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(255, "Name must be 255 characters or less")
  .trim();

// Error handling utility
export function formatZodError(error: z.ZodError) {
  return error.errors.reduce(
    (acc, err) => {
      const path = err.path.join(".");
      acc[path] = err.message;
      return acc;
    },
    {} as Record<string, string>
  );
}

// Validation middleware helper
export function validateRequest<T = any>(
  schema: z.ZodTypeAny,
  data: unknown
): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  try {
    const validatedData = schema.parse(data) as T;
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: formatZodError(error) };
    }
    return { success: false, errors: { general: "Validation failed" } };
  }
}
