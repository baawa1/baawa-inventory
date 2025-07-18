import { z } from "zod";

// Base category validation schema
export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Category name must be less than 100 characters")
    .trim(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  image: z
    .string()
    .max(500, "Image URL must be less than 500 characters")
    .optional(),
  isActive: z.boolean().optional().default(true),
});

// Create category schema
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Category name must be less than 100 characters")
    .trim(),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  image: z
    .string()
    .max(500, "Image URL must be less than 500 characters")
    .optional(),
  isActive: z.boolean().default(true),
});

// Update category schema (partial for flexibility)
export const updateCategorySchema = categorySchema.partial().extend({
  id: z.number().int().positive(),
});

// Category query schema for filtering
export const categoryQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(10),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(["name", "createdAt", "updatedAt"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// Category ID validation
export const categoryIdSchema = z.object({
  id: z.string().transform((val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) {
      throw new Error("Invalid category ID");
    }
    return num;
  }),
});

// Export types
export type CreateCategoryData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryData = z.infer<typeof updateCategorySchema>;
export type CategoryQueryData = z.infer<typeof categoryQuerySchema>;
export type CategoryIdData = z.infer<typeof categoryIdSchema>;
