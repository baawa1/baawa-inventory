import { z } from "zod";

// Zod schema for validation
export const productImageSchema = z.object({
  id: z.string().optional(),
  url: z.string().url("Invalid image URL"),
  filename: z.string().min(1, "Filename is required"),
  size: z.number().min(0, "Size must be positive"),
  mimeType: z.string().min(1, "MIME type is required"),
  alt: z.string().optional(),
  altText: z.string().optional(), // Support both alt and altText for backward compatibility
  isPrimary: z.boolean().default(false),
  uploadedAt: z.string().datetime("Invalid upload date"),
});

export const updateImagesSchema = z.object({
  images: z.array(productImageSchema),
});

// TypeScript interface
export interface ProductImage {
  id?: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  alt?: string;
  altText?: string;
  isPrimary: boolean;
  uploadedAt: string;
}

// Database storage format (simplified for Prisma)
export interface ProductImageStorage {
  url: string;
  altText: string;
  isPrimary: boolean;
}

// Upload result from storage service
export interface ImageUploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  storagePath: string;
  publicId: string;
}

// Constants
export const IMAGE_CONSTANTS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp"] as const,
  MAX_DIMENSION: 1920,
  DEFAULT_QUALITY: 85,
  MAX_FILES_PER_PRODUCT: 10,
} as const;

export type AllowedImageType = (typeof IMAGE_CONSTANTS.ALLOWED_TYPES)[number];
