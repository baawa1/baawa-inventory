import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { withPOSAuth, AuthenticatedRequest } from '@/lib/api-auth-middleware';
import { PRODUCT_STATUS, ERROR_MESSAGES } from '@/lib/constants';

// Validation schema for barcode lookup
const barcodeSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required'),
});

async function handleBarcodeSearch(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validated = barcodeSchema.parse({
      barcode: searchParams.get('barcode')?.trim(),
    });

    const product = await prisma.product.findFirst({
      where: {
        status: PRODUCT_STATUS.ACTIVE,
        sku: {
          equals: validated.barcode,
          mode: 'insensitive',
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: validated.barcode,
      price: product.price,
      stock: product.stock,
      status: product.status,
      category: product.category?.name || 'Uncategorized',
      brand: product.brand?.name || 'No Brand',
      description: product.description,
      images: product.images,
      primaryImageUrl: Array.isArray(product.images)
        ? typeof product.images[0] === 'string'
          ? product.images[0]
          : (product.images[0] as { url?: string } | undefined)?.url || null
        : null,
      updatedAt: product.updatedAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.VALIDATION_ERROR, details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: 500 }
    );
  }
}

export const GET = withPOSAuth(handleBarcodeSearch);
