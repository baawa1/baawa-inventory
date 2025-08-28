import { NextResponse } from 'next/server';
import {
  withAuth,
  withPermission,
  AuthenticatedRequest,
} from '@/lib/api-middleware';
import { handleApiError } from '@/lib/api-error-handler-new';
import { prisma } from '@/lib/db';
import { USER_ROLES } from '@/lib/auth/roles';
import { brandIdSchema, updateBrandSchema } from '@/lib/validations/brand';

// GET /api/brands/[id] - Get a specific brand
export const GET = withAuth(
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      // Await params first, then validate brand ID
      const resolvedParams = await params;
      const { id } = brandIdSchema.parse(resolvedParams);

      const brand = await prisma.brand.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

      if (!brand) {
        return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
      }

      // Transform response to include product count
      const transformedBrand = {
        id: brand.id,
        name: brand.name,
        description: brand.description,
        wordpress_id: brand.wordpress_id,
        website: brand.website,
        isActive: brand.isActive,
        productCount: brand._count.products,
        createdAt: brand.createdAt,
        updatedAt: brand.updatedAt,
      };

      return NextResponse.json({
        success: true,
        data: transformedBrand,
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// PUT /api/brands/[id] - Update a specific brand
export const PUT = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      // Await params first, then validate brand ID
      const resolvedParams = await params;
      const { id } = brandIdSchema.parse(resolvedParams);

      const body = await request.json();
      const validatedData = updateBrandSchema.parse(body);

      // Check if brand exists
      const existingBrand = await prisma.brand.findUnique({
        where: { id },
        select: { id: true, name: true },
      });

      if (!existingBrand) {
        return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
      }

      // Check if the new name conflicts with existing brands (excluding current brand)
      if (validatedData.name && validatedData.name !== existingBrand.name) {
        const nameConflict = await prisma.brand.findFirst({
          where: {
            name: {
              equals: validatedData.name,
              mode: 'insensitive',
            },
            id: { not: id },
          },
        });

        if (nameConflict) {
          return NextResponse.json(
            { error: 'Brand with this name already exists' },
            { status: 409 }
          );
        }
      }

      // Update the brand
      const updatedBrand = await prisma.brand.update({
        where: { id },
        data: validatedData,
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

      // Transform response to include product count
      const transformedBrand = {
        id: updatedBrand.id,
        name: updatedBrand.name,
        description: updatedBrand.description,
        wordpress_id: updatedBrand.wordpress_id,
        website: updatedBrand.website,
        isActive: updatedBrand.isActive,
        productCount: updatedBrand._count.products,
        createdAt: updatedBrand.createdAt,
        updatedAt: updatedBrand.updatedAt,
      };

      return NextResponse.json({
        success: true,
        message: 'Brand updated successfully',
        data: transformedBrand,
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// DELETE /api/brands/[id] - Delete a specific brand
export const DELETE = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      // Await params first, then validate brand ID
      const resolvedParams = await params;
      const { id } = brandIdSchema.parse(resolvedParams);

      // Check if brand exists
      const existingBrand = await prisma.brand.findUnique({
        where: { id },
        select: { id: true, name: true },
      });

      if (!existingBrand) {
        return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
      }

      // Check if brand is being used by products
      const products = await prisma.product.findFirst({
        where: { brandId: id },
        select: { id: true },
      });

      if (products) {
        return NextResponse.json(
          { error: 'Cannot delete brand that is being used by products' },
          { status: 400 }
        );
      }

      // Delete the brand
      await prisma.brand.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: 'Brand deleted successfully',
        data: { id, name: existingBrand.name },
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
