import type { Prisma, PrismaClient } from '@prisma/client';
import { supabaseStorageServer } from '@/lib/upload/supabase-storage';
import { logger } from '@/lib/logger';
import {
  convertLegacyImages,
  convertFromStorageFormat,
  convertToStorageFormat,
  ensureUniqueImages,
  sortImages,
  extractStoragePath,
  generateMeaningfulFilename,
  generateAltText,
  buildProductImageFolder,
} from '@/lib/utils/image-utils';
import type { ProductImage, ProductImageStorage } from '@/types/product-images';

interface PromotionOptions {
  force?: boolean;
}

type PrismaClientLike = PrismaClient | Prisma.TransactionClient;

/**
 * Move product images into the SKU-specific folder and normalize filenames.
 *
 * Returns `true` if any database update was performed.
 */
export async function promoteProductImagesToSkuFolder(
  prismaClient: PrismaClientLike,
  productId: number,
  options: PromotionOptions = {}
): Promise<boolean> {
  const product = await prismaClient.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      sku: true,
      images: true,
      brand: { select: { name: true } },
      category: { select: { name: true } },
    },
  });

  if (!product || !product.sku || !product.images) {
    return false;
  }

  const folder = buildProductImageFolder(product.sku);

  let images: ProductImage[] = [];
  const rawImages = product.images as unknown[];

  if (!Array.isArray(rawImages) || rawImages.length === 0) {
    return false;
  }

  const wasLegacyFormat = typeof rawImages[0] === 'string';

  if (wasLegacyFormat) {
    images = convertLegacyImages(rawImages as string[]);
  } else {
    images = convertFromStorageFormat(
      rawImages as ProductImageStorage[],
      product.name,
      product.brand?.name,
      product.category?.name
    );
  }

  if (images.length === 0) {
    return false;
  }

  images = sortImages(ensureUniqueImages(images));

  const updatedImages: ProductImage[] = [];
  let changesMade = false;

  for (let index = 0; index < images.length; index++) {
    const originalImage = images[index];
    const image = { ...originalImage };
    const storagePath = extractStoragePath(image.url);

    const shouldBePrimary = index === 0;
    if (image.isPrimary !== shouldBePrimary) {
      image.isPrimary = shouldBePrimary;
      changesMade = true;
    }

    const originalFilename =
      image.filename || storagePath?.split('/').pop() || `image-${index + 1}.jpg`;

    const newFilename = generateMeaningfulFilename(
      originalFilename,
      index,
      product.name,
      product.brand?.name,
      product.category?.name
    );

    if (image.filename !== newFilename) {
      image.filename = newFilename;
      changesMade = true;
    }

    const newAlt = generateAltText(
      product.name,
      product.brand?.name,
      product.category?.name,
      index
    );

    if (image.alt !== newAlt) {
      image.alt = newAlt;
      changesMade = true;
    } else {
      image.alt = newAlt;
    }

    const targetPath = `${folder}/${newFilename}`;

    if (!storagePath) {
      updatedImages.push(image);
      continue;
    }

    if (storagePath !== targetPath || options.force) {
      try {
        await supabaseStorageServer.moveFile(storagePath, targetPath);
        const newUrl = supabaseStorageServer.getPublicUrl(targetPath);
        if (image.url !== newUrl) {
          image.url = newUrl;
          changesMade = true;
        }
      } catch (error) {
        logger.warn('Failed to promote product image to SKU folder', {
          productId,
          sku: product.sku,
          fromPath: storagePath,
          toPath: targetPath,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    updatedImages.push(image);
  }

  const storageImages = convertToStorageFormat(updatedImages);

  if (!changesMade && !wasLegacyFormat && !options.force) {
    return false;
  }

  const data: { images?: Prisma.InputJsonValue } = {};

  if (storageImages.length > 0) {
    data.images = storageImages as unknown as Prisma.InputJsonValue;
  } else {
    data.images = [] as unknown as Prisma.InputJsonValue;
  }

  await prismaClient.product.update({
    where: { id: productId },
    data,
  });

  return true;
}
