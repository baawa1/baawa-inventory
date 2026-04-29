import { z } from 'zod';
import type { AppUser, UserRole, UserStatus } from '@/types/user';
import { passwordSchema } from '@/lib/validations/common';

// Base user schema without password fields
const baseUserSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must not exceed 50 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must not exceed 50 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF'], {
    required_error: 'Role is required',
  }),
  userStatus: z.enum(
    ['PENDING', 'VERIFIED', 'APPROVED', 'REJECTED', 'SUSPENDED'],
    {
      required_error: 'Status is required',
    }
  ),
});

// User form validation schema for creating users
export const createUserFormSchema = baseUserSchema
  .extend({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// User form validation schema for editing users
export const editUserFormSchema = baseUserSchema;

// Generic user form schema type
export type UserFormData = z.infer<typeof createUserFormSchema>;
export type EditUserFormData = z.infer<typeof editUserFormSchema>;

// Use AppUser from unified types
export type User = AppUser;
export type { UserRole, UserStatus };
