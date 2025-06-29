import { z } from "zod";

// Common validation schemas
export const idSchema = z.number().int().positive();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional().default("created_at"),
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
  "active",
  "inactive",
  "discontinued",
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
  .regex(
    /^(\+234[7-9]\d{9}|0[7-9]\d{9})$/,
    "Phone number must be in Nigerian format: +2347087367278 or 07039893476"
  );

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

// Password validation schemas
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one lowercase letter, one uppercase letter, and one number"
  );

export const simplePasswordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters");

export const currentPasswordSchema = z
  .string()
  .min(1, "Current password is required");

// Error handling utility
export function formatZodError(error: z.ZodError): Record<string, string> {
  return error.errors.reduce(
    (acc, err) => {
      const path = err.path.join(".");
      acc[path] = err.message;
      return acc;
    },
    {} as Record<string, string>
  );
}

// Type-safe validation result
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

// Validation middleware helper with proper typing
export function validateRequest<T>(
  schema: z.ZodType<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: formatZodError(error) };
    }
    return { success: false, errors: { general: "Validation failed" } };
  }
}

// Async validation helper for API routes
export async function validateRequestBody<T>(
  schema: z.ZodType<T>,
  request: Request
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    return validateRequest(schema, body);
  } catch (error) {
    return {
      success: false,
      errors: { general: "Invalid JSON in request body" },
    };
  }
}

// Query parameter validation helper
export function validateSearchParams<T>(
  schema: z.ZodType<T>,
  searchParams: URLSearchParams
): ValidationResult<T> {
  try {
    const params: Record<string, string | string[]> = {};

    // Convert URLSearchParams to a plain object
    searchParams.forEach((value, key) => {
      if (params[key]) {
        // Handle multiple values for the same key
        if (Array.isArray(params[key])) {
          (params[key] as string[]).push(value);
        } else {
          params[key] = [params[key] as string, value];
        }
      } else {
        params[key] = value;
      }
    });

    return validateRequest(schema, params);
  } catch (error) {
    return {
      success: false,
      errors: { general: "Invalid search parameters" },
    };
  }
}

// Standard error response format for API routes
export interface ApiError {
  message: string;
  errors?: Record<string, string>;
  code?: string;
}

// Create standardized error response
export function createValidationError(
  message: string,
  errors?: Record<string, string>,
  code?: string
): ApiError {
  return {
    message,
    errors,
    code: code || "VALIDATION_ERROR",
  };
}

// Common validation patterns for forms
export const baseFormValidations = {
  required: (fieldName: string) =>
    z.string().min(1, `${fieldName} is required`),

  optionalString: (maxLength: number = 255) =>
    z.string().max(maxLength).optional().nullable(),

  optionalNumber: () => z.number().optional().nullable(),

  currency: () => priceSchema,

  percentage: () =>
    z
      .number()
      .min(0, "Percentage cannot be negative")
      .max(100, "Percentage cannot exceed 100"),

  positiveInteger: () => z.number().int().positive("Must be a positive number"),

  optionalPositiveInteger: () =>
    z.number().int().positive().optional().nullable(),
} as const;

// Validation schema builders for common entities
export const entityValidations = {
  withTimestamps: <T extends z.ZodRawShape>(baseSchema: z.ZodObject<T>) =>
    baseSchema.extend({
      createdAt: z.date().optional(),
      updatedAt: z.date().optional(),
    }),

  withId: <T extends z.ZodRawShape>(baseSchema: z.ZodObject<T>) =>
    baseSchema.extend({
      id: idSchema.optional(),
    }),

  withAudit: <T extends z.ZodRawShape>(baseSchema: z.ZodObject<T>) =>
    baseSchema.extend({
      createdBy: idSchema.optional(),
      updatedBy: idSchema.optional(),
    }),
} as const;
