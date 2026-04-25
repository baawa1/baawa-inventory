import { NextRequest, NextResponse } from 'next/server';
import { auth } from '#root/auth';
import { prisma } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import { AuditLogAction } from '@/types/audit';
import { z } from 'zod';

// Archive/Unarchive product endpoint
const archiveProductSchema = z.object({
  productId: z.number().positive(),
  archived: z.boolean(),
  reason: z.string().optional(),
});

class ProductArchiveError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

// PATCH /api/products/[id]/archive - Archive or unarchive a product
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: paramId } = await params;
    const body = await request.json();
    const productId = parseInt(paramId);

    // Validate request
    const validatedData = archiveProductSchema.parse({
      productId,
      ...body,
    });

    const { archived, reason } = validatedData;

    const updatedProduct = await prisma.$transaction(async tx => {
      const existingProduct = await tx.product.findUnique({
        where: { id: productId },
        select: { id: true, name: true, isArchived: true, status: true },
      });

      if (!existingProduct) {
        throw new ProductArchiveError(404, 'Product not found');
      }

      if (existingProduct.isArchived === archived) {
        throw new ProductArchiveError(
          400,
          `Product is already ${archived ? 'archived' : 'active'}`
        );
      }

      const nextProduct = await tx.product.update({
        where: { id: productId },
        data: {
          isArchived: archived,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          isArchived: true,
          status: true,
        },
      });

      await createAuditLog({
        tx,
        userId: parseInt(session.user.id),
        action: archived
          ? AuditLogAction.PRODUCT_ARCHIVED
          : AuditLogAction.PRODUCT_UNARCHIVED,
        tableName: 'products',
        recordId: productId,
        oldValues: {
          isArchived: existingProduct.isArchived,
          status: existingProduct.status,
        },
        newValues: {
          isArchived: archived,
          status: nextProduct.status,
          reason: reason?.trim() || null,
        },
      });

      return nextProduct;
    });

    return NextResponse.json({
      data: updatedProduct,
      message: `Product ${archived ? 'archived' : 'unarchived'} successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    if (error instanceof ProductArchiveError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error in PATCH /api/products/[id]/archive:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
