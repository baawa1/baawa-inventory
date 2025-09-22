import {
  ProductImage,
  ProductImageStorage,
  IMAGE_CONSTANTS,
} from '@/types/product-images';

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
    filename: url.split('/').pop() || `image-${index}`,
    size: 0,
    mimeType: 'image/jpeg',
    alt: '',
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
  return images.map(img => ({
    url: img.url,
    altText: img.alt || img.altText || '',
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
    filename: img.filename || img.url.split('/').pop() || `image-${index}`,
    size: img.size || 0,
    mimeType: img.mimeType || 'image/jpeg',
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
  const brandText = brandName ? ` ${brandName}` : '';
  const categoryText = categoryName ? ` ${categoryName}` : '';

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
  _brandName?: string,
  _categoryName?: string
): string {
  const sanitizedName = sanitizePathSegment(productName || 'product', 60);
  const increment = String(index + 1).padStart(2, '0');
  const extension = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';

  return `${sanitizedName}-${increment}.${extension}`;
}

/**
 * Build the storage folder path for a product using its SKU
 */
export function buildProductImageFolder(sku?: string | null): string {
  const sanitizedSku = sanitizePathSegment(sku ?? '', 60, { lowercase: false });

  if (!sanitizedSku) {
    throw new Error('SKU is required to determine the product image folder');
  }

  return `products/${sanitizedSku}`;
}

/**
 * Sanitize a string so it is safe to use as part of a storage path
 */
export function sanitizePathSegment(
  value: string,
  maxLength: number,
  options: { lowercase?: boolean } = {}
): string {
  const shouldLowercase = options.lowercase ?? true;

  let sanitized = value
    .trim()
    .replace(/[^a-zA-Z0-9_\-\s]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, maxLength)
    .replace(/^-+|-+$/g, '');

  return shouldLowercase ? sanitized.toLowerCase() : sanitized;
}

/**
 * Ensure images array has no duplicates
 */
export function ensureUniqueImages(images: ProductImage[]): ProductImage[] {
  return images.filter(
    (image, index, self) =>
      index === self.findIndex(img => img.url === image.url)
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
    filename: String(image.filename || image.url.split('/').pop() || 'image'),
    mimeType: String(image.mimeType || 'image/jpeg'),
    alt: image.alt ? String(image.alt) : '',
    isPrimary: Boolean(image.isPrimary),
    uploadedAt: String(image.uploadedAt || new Date().toISOString()),
    size: Number(image.size || 0),
  };
}

/**
 * Extract storage path from Supabase URL
 */
export function extractStoragePath(url: string): string | null {
  if (!url.includes('supabase.co')) {
    return null;
  }

  try {
    const { pathname } = new URL(url);
    const segments = pathname.split('/').filter(Boolean);
    const bucketIndex = segments.indexOf('product-images');

    if (bucketIndex === -1 || bucketIndex === segments.length - 1) {
      return null;
    }

    return segments.slice(bucketIndex + 1).join('/');
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
