import {
  ProductImage,
  ProductImageStorage,
  IMAGE_CONSTANTS,
} from "@/types/product-images";

/**
 * Image utility functions for consistent image handling across the application
 */

/**
 * Convert legacy string array format to ProductImage objects
 */
export function convertLegacyImages(imageUrls: string[]): ProductImage[] {
  return imageUrls.map((url, index) => ({
    id: `legacy-${index}`,
    url,
    filename: url.split("/").pop() || `image-${index}`,
    size: 0,
    mimeType: "image/jpeg",
    alt: "",
    isPrimary: index === 0,
    uploadedAt: new Date().toISOString(),
  }));
}

/**
 * Convert image objects to database storage format
 */
export function convertToStorageFormat(
  images: ProductImage[]
): ProductImageStorage[] {
  return images.map((img) => ({
    url: img.url,
    altText: img.alt || img.altText || "",
    isPrimary: img.isPrimary,
  }));
}

/**
 * Convert database storage format to ProductImage objects
 */
export function convertFromStorageFormat(
  storageImages: any[],
  productName: string,
  brandName?: string,
  categoryName?: string
): ProductImage[] {
  return storageImages.map((img, index) => ({
    id: img.id || `restored-${index}`,
    url: img.url,
    filename: img.filename || img.url.split("/").pop() || `image-${index}`,
    size: img.size || 0,
    mimeType: img.mimeType || "image/jpeg",
    alt:
      img.alt ||
      img.altText ||
      generateAltText(productName, brandName, categoryName, index),
    isPrimary: img.isPrimary !== undefined ? img.isPrimary : index === 0,
    uploadedAt: img.uploadedAt || new Date().toISOString(),
  }));
}

/**
 * Generate meaningful alt text for images
 */
export function generateAltText(
  productName: string,
  brandName?: string,
  categoryName?: string,
  index: number = 0
): string {
  const brandText = brandName ? ` ${brandName}` : "";
  const categoryText = categoryName ? ` ${categoryName}` : "";

  if (index === 0) {
    return `${productName}${brandText}${categoryText}`;
  } else {
    return `${productName}${brandText}${categoryText} - Image ${index + 1}`;
  }
}

/**
 * Generate meaningful filename based on product information
 */
export function generateMeaningfulFilename(
  originalFilename: string,
  index: number,
  productName: string,
  brandName?: string,
  categoryName?: string
): string {
  // Clean product name: remove special chars, convert to lowercase, replace spaces with hyphens
  const cleanName = productName
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .substring(0, 60); // Limit length

  // Clean brand name
  const cleanBrandName = brandName
    ? brandName
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase()
        .substring(0, 30)
    : "no-brand";

  // Clean category name
  const cleanCategoryName = categoryName
    ? categoryName
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase()
        .substring(0, 30)
    : "uncategorized";

  // Get file extension from original filename
  const extension = originalFilename.split(".").pop()?.toLowerCase() || "jpg";

  // Generate increment (01, 02, 03, etc.)
  const increment = String(index + 1).padStart(2, "0");

  // Combine all parts
  return `${cleanName}-${cleanBrandName}-${cleanCategoryName}-${increment}.${extension}`;
}

/**
 * Ensure images array has no duplicates
 */
export function ensureUniqueImages(images: ProductImage[]): ProductImage[] {
  return images.filter(
    (image, index, self) =>
      index === self.findIndex((img) => img.url === image.url)
  );
}

/**
 * Sort images with primary first, then by upload date (newest first)
 */
export function sortImages(images: ProductImage[]): ProductImage[] {
  return images.sort((a, b) => {
    // Primary images first
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    // Then by upload date (newest first)
    return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
  });
}

/**
 * Validate image data
 */
export function validateImageData(image: any): ProductImage {
  return {
    url: String(image.url),
    filename: String(image.filename || image.url.split("/").pop() || "image"),
    mimeType: String(image.mimeType || "image/jpeg"),
    alt: image.alt ? String(image.alt) : "",
    isPrimary: Boolean(image.isPrimary),
    uploadedAt: String(image.uploadedAt || new Date().toISOString()),
    size: Number(image.size || 0),
  };
}

/**
 * Extract storage path from Supabase URL
 */
export function extractStoragePath(url: string): string | null {
  if (!url.includes("supabase.co")) {
    return null;
  }

  try {
    const urlParts = url.split("/");
    return urlParts.slice(-2).join("/"); // Get folder/filename
  } catch {
    return null;
  }
}

/**
 * Check if file type is allowed
 */
export function isAllowedFileType(mimeType: string): boolean {
  return IMAGE_CONSTANTS.ALLOWED_TYPES.includes(mimeType as any);
}

/**
 * Check if file size is within limits
 */
export function isFileSizeValid(size: number): boolean {
  return size <= IMAGE_CONSTANTS.MAX_FILE_SIZE;
}

/**
 * Validate image count
 */
export function validateImageCount(count: number): boolean {
  return count <= IMAGE_CONSTANTS.MAX_FILES_PER_PRODUCT;
}
