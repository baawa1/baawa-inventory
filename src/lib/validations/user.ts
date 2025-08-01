import { z } from 'zod';
import {
  idSchema,
  paginationSchema,
  searchSchema,
  userRoleSchema,
  userStatusSchema,
  emailSchema,
  phoneSchema,
  nameSchema,
  passwordSchema,
  currentPasswordSchema,
} from './common';

// User creation schema
export const createUserSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema, // Changed from simplePasswordSchema to passwordSchema
  phone: phoneSchema.optional(),
  role: userRoleSchema.default('STAFF'),
  isActive: z.boolean().default(true),
  notes: z
    .string()
    .max(500, 'Notes must be 500 characters or less')
    .optional()
    .nullable(),
});

// User update schema (all fields optional except validation rules)
export const updateUserSchema = createUserSchema
  .partial()
  .extend({
    password: passwordSchema.optional(), // Changed from simplePasswordSchema to passwordSchema
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

// User query parameters schema
export const userQuerySchema = paginationSchema.merge(searchSchema).extend({
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
  isActive: z
    .string()
    .optional()
    .transform(val => {
      if (val === undefined) return undefined;
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
});

// User ID parameter schema
export const userIdSchema = z.object({
  id: idSchema,
});

// User login schema (for future authentication)
export const userLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// User password change schema
export const changePasswordSchema = z
  .object({
    currentPassword: currentPasswordSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// User profile update schema (limited fields)
export const updateUserProfileSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phone: phoneSchema,
  avatar_url: z.string().url().optional().nullable(),
});

// Bulk user operations
export const bulkUpdateUserStatusSchema = z.object({
  userIds: z.array(idSchema).min(1, 'At least one user ID is required'),
  isActive: z.boolean(),
});

export const bulkUpdateUserRoleSchema = z.object({
  userIds: z.array(idSchema).min(1, 'At least one user ID is required'),
  role: userRoleSchema,
});
