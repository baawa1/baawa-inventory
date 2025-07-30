import { auth } from '#root/auth';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { createSecureResponse } from '@/lib/security-headers';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiting';
import { z } from 'zod';
import {
  updateImagesSchema,
  ProductImage,
  IMAGE_CONSTANTS,
} from '@/types/product-images';
import {
  convertLegacyImages,
  convertToStorageFormat,
  convertFromStorageFormat,
  extractStoragePath,
  validateImageCount,
  ensureUniqueImages,
  sortImages,
} from '@/lib/utils/image-utils';

export const GET = withRateLimit(RATE_LIMIT_CONFIGS.API)(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const session = await auth();
    if (!session?.user) {
      return createSecureResponse({ error: 'Unauthorized' }, 401);
    }

    // Allow all authenticated users to view images
    const { id } = await params;
    const productId = parseInt(id);
    if (isNaN(productId)) {
      return createSecureResponse({ error: 'Invalid product ID' }, 400);
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        images: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    if (!product) {
      return createSecureResponse({ error: 'Product not found' }, 404);
    }

    // Handle both legacy string array and new image object array
    let images: ProductImage[] = [];

    if (product.images) {
      if (
        Array.isArray(product.images) &&
        typeof product.images[0] === 'string'
      ) {
        // Legacy format: string array
        images = convertLegacyImages(product.images as string[]);
      } else {
        // New format: image object array
        images = convertFromStorageFormat(
          product.images as any[],
          product.name,
          product.brand?.name,
          product.category?.name
        );
      }
    }

    // Sort images and ensure uniqueness
    const sortedImages = sortImages(ensureUniqueImages(images));

    logger.info('Product images fetched successfully', {
      productId: product.id,
      imageCount: sortedImages.length,
      userId: session.user.id,
    });

    return createSecureResponse({
      productId: product.id,
      productName: product.name,
      images: sortedImages,
    });
  } catch (error) {
    const session = await auth();
    logger.error('Error fetching product images', {
      error: error instanceof Error ? error.message : 'Unknown error',
      productId: await params.then(p => p.id),
      userId: session?.user?.id,
    });
    return createSecureResponse(
      { error: 'Failed to fetch product images' },
      500
    );
  }
});

export const PUT = withRateLimit(RATE_LIMIT_CONFIGS.UPLOAD)(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const session = await auth();
    if (!session?.user) {
      return createSecureResponse({ error: 'Unauthorized' }, 401);
    }

    // Check permissions
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return createSecureResponse({ error: 'Insufficient permissions' }, 403);
    }

    const { id } = await params;
    const productId = parseInt(id);
    if (isNaN(productId)) {
      return createSecureResponse({ error: 'Invalid product ID' }, 400);
    }

    const body = await request.json();
    const { images } = updateImagesSchema.parse(body);

    // Validate image count
    if (!validateImageCount(images.length)) {
      return createSecureResponse(
        {
          error: `Maximum ${IMAGE_CONSTANTS.MAX_FILES_PER_PRODUCT} images allowed per product`,
        },
        400
      );
    }

    // Get current images to identify files that need cleanup
    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { images: true },
    });

    // Extract current URLs for cleanup (handle both legacy and new formats)
    let currentImageUrls: string[] = [];
    if (currentProduct?.images) {
      if (
        Array.isArray(currentProduct.images) &&
        typeof currentProduct.images[0] === 'string'
      ) {
        // Legacy format
        currentImageUrls = currentProduct.images as string[];
      } else {
        // New format: extract URLs from image objects
        currentImageUrls = (currentProduct.images as any[]).map(
          (img: any) => img.url
        );
      }
    }

    // Find images that were removed (for cleanup)
    const removedImageUrls = currentImageUrls.filter(
      currentUrl => !images.some(newImg => newImg.url === currentUrl)
    );

    // Clean up removed files from storage
    for (const removedImageUrl of removedImageUrls) {
      const storagePath = extractStoragePath(removedImageUrl);
      if (storagePath) {
        try {
          const deleteResponse = await fetch(
            `${request.nextUrl.origin}/api/upload?publicId=${encodeURIComponent(storagePath)}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${session.user.id}`,
              },
            }
          );

          if (!deleteResponse.ok) {
            logger.warn('Failed to delete removed file from storage', {
              removedImageUrl,
              status: deleteResponse.status,
              userId: session.user.id,
            });
          }
        } catch (error) {
          logger.warn('Error deleting removed file from storage', {
            error: error instanceof Error ? error.message : 'Unknown error',
            removedImageUrl,
            userId: session.user.id,
          });
        }
      }
    }

    // Ensure only one image is marked as primary
    const primaryImages = images.filter(img => img.isPrimary);
    if (primaryImages.length > 1) {
      return createSecureResponse(
        { error: 'Only one image can be marked as primary' },
        400
      );
    }

    // If no primary image is set and there are images, set the first one as primary
    if (primaryImages.length === 0 && images.length > 0) {
      images[0].isPrimary = true;
    }

    // Convert to storage format
    const imageObjects = convertToStorageFormat(images);

    logger.info('Updating product images', {
      productId,
      imageCount: images.length,
      userId: session.user.id,
    });

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        images: imageObjects.length > 0 ? (imageObjects as any) : undefined,
      },
      select: { id: true, name: true, images: true },
    });

    return createSecureResponse({
      message: 'Product images updated successfully',
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        images: updatedProduct.images || [],
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createSecureResponse(
        { error: 'Invalid image data', details: error.errors },
        400
      );
    }

    const session = await auth();
    logger.error('Error updating product images', {
      error: error instanceof Error ? error.message : 'Unknown error',
      productId: await params.then(p => p.id),
      userId: session?.user?.id,
    });
    return createSecureResponse(
      { error: 'Failed to update product images' },
      500
    );
  }
});

export const DELETE = withRateLimit(RATE_LIMIT_CONFIGS.UPLOAD)(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const session = await auth();
    if (!session?.user) {
      return createSecureResponse({ error: 'Unauthorized' }, 401);
    }

    // Check permissions
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return createSecureResponse({ error: 'Insufficient permissions' }, 403);
    }

    const { id } = await params;
    const productId = parseInt(id);
    if (isNaN(productId)) {
      return createSecureResponse({ error: 'Invalid product ID' }, 400);
    }

    // Get the imageUrl from query parameters
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('imageUrl');

    if (!imageUrl) {
      return createSecureResponse({ error: 'Image URL is required' }, 400);
    }

    // Get current images
    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { images: true },
    });

    if (!currentProduct?.images) {
      return createSecureResponse(
        { error: 'No images found for this product' },
        404
      );
    }

    // Handle both legacy and new formats
    let currentImages: any[] = [];
    if (
      Array.isArray(currentProduct.images) &&
      typeof currentProduct.images[0] === 'string'
    ) {
      // Legacy format: convert to new format for processing
      currentImages = (currentProduct.images as string[]).map((url, index) => ({
        url,
        filename: url.split('/').pop() || `image-${index}`,
        mimeType: 'image/jpeg',
        alt: '',
        isPrimary: index === 0,
        uploadedAt: new Date().toISOString(),
      }));
    } else {
      // New format
      currentImages = currentProduct.images as any[];
    }

    // Find the image to delete by URL
    const imageToDelete = currentImages.find(img => img.url === imageUrl);
    if (!imageToDelete) {
      return createSecureResponse({ error: 'Image not found' }, 404);
    }

    // Remove the image from the array
    const updatedImages = currentImages.filter(img => img.url !== imageUrl);

    // If we deleted the primary image and there are other images, make the first one primary
    if (imageToDelete.isPrimary && updatedImages.length > 0) {
      updatedImages[0].isPrimary = true;
    }

    // Clean up the deleted file from storage
    const storagePath = extractStoragePath(imageToDelete.url);
    if (storagePath) {
      try {
        const deleteResponse = await fetch(
          `${request.nextUrl.origin}/api/upload?publicId=${encodeURIComponent(storagePath)}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${session.user.id}`,
            },
          }
        );

        if (!deleteResponse.ok) {
          logger.warn('Failed to delete file from storage', {
            imageUrl: imageToDelete.url,
            status: deleteResponse.status,
            userId: session.user.id,
          });
        }
      } catch (error) {
        logger.warn('Error deleting file from storage', {
          error: error instanceof Error ? error.message : 'Unknown error',
          imageUrl: imageToDelete.url,
          userId: session.user.id,
        });
      }
    }

    // Convert back to the format stored in the database
    const imageObjects = convertToStorageFormat(updatedImages);

    logger.info('Image deleted successfully', {
      productId,
      imageUrl,
      userId: session.user.id,
    });

    // Update the product with the remaining images
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        images: imageObjects.length > 0 ? (imageObjects as any) : undefined,
      },
      select: { id: true, name: true, images: true },
    });

    return createSecureResponse({
      message: 'Image deleted successfully',
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        images: updatedProduct.images || [],
      },
    });
  } catch (error) {
    const session = await auth();
    logger.error('Error deleting image', {
      error: error instanceof Error ? error.message : 'Unknown error',
      productId: await params.then(p => p.id),
      userId: session?.user?.id,
    });
    return createSecureResponse({ error: 'Failed to delete image' }, 500);
  }
});
