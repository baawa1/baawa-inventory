import { NextResponse } from 'next/server';
import { withPermission, AuthenticatedRequest } from '@/lib/api-middleware';
import { handleApiError } from '@/lib/api-error-handler-new';
import { USER_ROLES } from '@/lib/auth/roles';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Schema for bulk archive operations
const bulkArchiveSchema = z.object({
  productIds: z.array(z.number()).min(1, 'At least one product ID is required'),
  action: z.enum(['archive', 'unarchive'], {
    required_error: "Action must be either 'archive' or 'unarchive'",
  }),
});

// POST /api/products/archive - Bulk archive/unarchive products
export const POST = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const validatedData = bulkArchiveSchema.parse(body);

      // Check if all products exist
      const existingProducts = await prisma.product.findMany({
        where: { id: { in: validatedData.productIds } },
        select: { id: true, name: true, isArchived: true },
      });

      if (existingProducts.length !== validatedData.productIds.length) {
        const foundIds = existingProducts.map(p => p.id);
        const missingIds = validatedData.productIds.filter(
          id => !foundIds.includes(id)
        );
        return NextResponse.json(
          { error: `Products not found: ${missingIds.join(', ')}` },
          { status: 404 }
        );
      }

      const isArchiving = validatedData.action === 'archive';

      // Filter products that are already in the desired state
      const productsToUpdate = existingProducts.filter(
        product => product.isArchived !== isArchiving
      );

      if (productsToUpdate.length === 0) {
        return NextResponse.json({
          message: `All selected products are already ${isArchiving ? 'archived' : 'unarchived'}`,
          updated: 0,
          skipped: existingProducts.length,
        });
      }

      // Update products
      const result = await prisma.product.updateMany({
        where: { id: { in: productsToUpdate.map(p => p.id) } },
        data: { isArchived: isArchiving },
      });

      return NextResponse.json({
        message: `Successfully ${isArchiving ? 'archived' : 'unarchived'} ${result.count} products`,
        updated: result.count,
        skipped: existingProducts.length - result.count,
        products: productsToUpdate.map(p => ({
          id: p.id,
          name: p.name,
          action: validatedData.action,
        })),
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
