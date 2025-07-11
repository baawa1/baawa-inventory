import { z } from "zod";
import type { AppUser, UserRole, UserStatus } from "@/types/user";

// Base user schema without password fields
const baseUserSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must not exceed 50 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must not exceed 50 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "MANAGER", "STAFF"], {
    required_error: "Role is required",
  }),
  userStatus: z.enum(
    ["PENDING", "VERIFIED", "APPROVED", "REJECTED", "SUSPENDED"],
    {
      required_error: "Status is required",
    }
  ),
});

// Password fields schema
const _passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password must be less than 128 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&)"
  );

// User form validation schema for creating users
export const createUserFormSchema = baseUserSchema
  .extend({
    password: _passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// User form validation schema for editing users
export const editUserFormSchema = baseUserSchema;

// Generic user form schema type
export const userFormSchema = z.union([
  createUserFormSchema,
  editUserFormSchema,
]);

export const createUserFormSchemaFunction = (isEditing: boolean) => {
  return isEditing ? editUserFormSchema : createUserFormSchema;
};

export type UserFormData = z.infer<typeof createUserFormSchema>;
export type EditUserFormData = z.infer<typeof editUserFormSchema>;

// Use AppUser from unified types
export type User = AppUser;
export type { UserRole, UserStatus };
