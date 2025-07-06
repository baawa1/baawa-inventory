import { z } from "zod";

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
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"], {
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
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// User form validation schema for creating users
export const createUserFormSchema = baseUserSchema
  .extend({
    password: z.string().min(8, "Password must be at least 8 characters"),
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

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  userStatus: "PENDING" | "VERIFIED" | "APPROVED" | "REJECTED" | "SUSPENDED";
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
  approvedBy?: number;
  approvedAt?: string;
  rejectionReason?: string;
}
