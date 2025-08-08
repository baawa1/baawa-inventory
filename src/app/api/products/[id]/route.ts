import { NextResponse } from 'next/server';
import {
  withAuth,
  withPermission,
  AuthenticatedRequest,
} from '@/lib/api-middleware';
import { handleApiError } from '@/lib/api-error-handler-new';
import { prisma } from '@/lib/db';
import { USER_ROLES } from '@/lib/auth/roles';
import { z } from 'zod';

// Input validation schemas
const ProductUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  sku: z.string().min(1).max(100).optional(),
  barcode: z.string().max(100).optional().nullable(),
  categoryId: z.number().int().positive().optional().nullable(),
  brandId: z.number().int().positive().optional().nullable(),
  supplierId: z.number().int().positive().optional().nullable(),
  // Frontend field names that need mapping
  purchasePrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  currentStock: z.number().min(0).optional(),
  minimumStock: z.number().min(0).optional(),
  maximumStock: z.number().min(0).optional().nullable(),
  status: z.string().optional(),
  // Database field names (direct mapping)
  cost: z.number().min(0).optional(),
  price: z.number().min(0).optional(),
  stock: z.number().min(0).optional(),
  minStock: z.number().min(0).optional(),
  maxStock: z.number().min(0).optional().nullable(),
  isArchived: z.boolean().optional(),
  // New fields
  unit: z.string().max(20).optional(),
  weight: z.number().positive().optional().nullable(),
  dimensions: z.string().max(100).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  size: z.string().max(50).optional().nullable(),
  material: z.string().max(100).optional().nullable(),
  tags: z.array(z.string()).optional(),

  // Note: images field is handled separately via /api/products/[id]/images endpoint
});

// GET /api/products/[id] - Get single product
export const GET = withAuth(
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const resolvedParams = await params;
      const productId = parseInt(resolvedParams.id);

      if (isNaN(productId)) {
        return NextResponse.json(
          { error: 'Invalid product ID' },
          { status: 400 }
        );
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
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
          supplier: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
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
        success: true,
        data: product,
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// PUT /api/products/[id] - Update product
export const PUT = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const resolvedParams = await params;
      const productId = parseInt(resolvedParams.id);
      const body = await request.json();

      const validatedData = ProductUpdateSchema.parse(body);

      if (isNaN(productId)) {
        return NextResponse.json(
          { error: 'Invalid product ID' },
          { status: 400 }
        );
      }

      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, sku: true, barcode: true },
      });

      if (!existingProduct) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      // Prepare update data, mapping frontend fields to database fields
      const updateData: any = {};

      // Direct field mappings
      if (validatedData.name !== undefined)
        updateData.name = validatedData.name;
      if (validatedData.description !== undefined)
        updateData.description = validatedData.description;
      if (validatedData.sku !== undefined) updateData.sku = validatedData.sku;
      if (validatedData.barcode !== undefined)
        updateData.barcode = validatedData.barcode;
      if (validatedData.categoryId !== undefined)
        updateData.categoryId = validatedData.categoryId;
      if (validatedData.brandId !== undefined)
        updateData.brandId = validatedData.brandId;
      if (validatedData.supplierId !== undefined)
        updateData.supplierId = validatedData.supplierId;
      if (validatedData.unit !== undefined)
        updateData.unit = validatedData.unit;
      if (validatedData.weight !== undefined)
        updateData.weight = validatedData.weight;
      if (validatedData.dimensions !== undefined)
        updateData.dimensions = validatedData.dimensions;
      if (validatedData.color !== undefined)
        updateData.color = validatedData.color;
      if (validatedData.size !== undefined)
        updateData.size = validatedData.size;
      if (validatedData.material !== undefined)
        updateData.material = validatedData.material;
      if (validatedData.tags !== undefined)
        updateData.tags = validatedData.tags;
      if (validatedData.isArchived !== undefined)
        updateData.isArchived = validatedData.isArchived;

      // Frontend to database field mappings
      if (validatedData.purchasePrice !== undefined)
        updateData.cost = validatedData.purchasePrice;
      if (validatedData.sellingPrice !== undefined)
        updateData.price = validatedData.sellingPrice;
      if (validatedData.currentStock !== undefined)
        updateData.stock = validatedData.currentStock;
      if (validatedData.minimumStock !== undefined)
        updateData.minStock = validatedData.minimumStock;
      if (validatedData.maximumStock !== undefined)
        updateData.maxStock = validatedData.maximumStock;

      // Direct database fields (fallback if frontend fields not provided)
      if (validatedData.cost !== undefined)
        updateData.cost = validatedData.cost;
      if (validatedData.price !== undefined)
        updateData.price = validatedData.price;
      if (validatedData.stock !== undefined)
        updateData.stock = validatedData.stock;
      if (validatedData.minStock !== undefined)
        updateData.minStock = validatedData.minStock;
      if (validatedData.maxStock !== undefined)
        updateData.maxStock = validatedData.maxStock;

      // Handle status mapping
      if (validatedData.status !== undefined) {
        updateData.status = validatedData.status;
      }

      // Check for SKU conflicts if SKU is being updated
      if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
        const skuConflict = await prisma.product.findFirst({
          where: {
            sku: validatedData.sku,
            id: { not: productId },
          },
          select: { id: true },
        });

        if (skuConflict) {
          return NextResponse.json(
            { error: 'Product with this SKU already exists' },
            { status: 409 }
          );
        }
      }

      // Check for barcode conflicts if barcode is being updated
      if (
        validatedData.barcode &&
        validatedData.barcode !== existingProduct.barcode
      ) {
        const barcodeConflict = await prisma.product.findFirst({
          where: {
            barcode: validatedData.barcode,
            id: { not: productId },
          },
          select: { id: true },
        });

        if (barcodeConflict) {
          return NextResponse.json(
            { error: 'Product with this barcode already exists' },
            { status: 409 }
          );
        }
      }

      // Validate relationships if provided
      if (validatedData.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: validatedData.categoryId },
          select: { id: true },
        });
        if (!category) {
          return NextResponse.json(
            { error: 'Category not found' },
            { status: 404 }
          );
        }
      }

      if (validatedData.brandId) {
        const brand = await prisma.brand.findUnique({
          where: { id: validatedData.brandId },
          select: { id: true },
        });
        if (!brand) {
          return NextResponse.json(
            { error: 'Brand not found' },
            { status: 404 }
          );
        }
      }

      if (validatedData.supplierId) {
        const supplier = await prisma.supplier.findUnique({
          where: { id: validatedData.supplierId },
          select: { id: true },
        });
        if (!supplier) {
          return NextResponse.json(
            { error: 'Supplier not found' },
            { status: 404 }
          );
        }
      }

      // Update the product
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: updateData,
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
          supplier: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct,
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// DELETE /api/products/[id] - Delete/Archive product
export const DELETE = withPermission(
  [USER_ROLES.ADMIN],
  async (
    request: AuthenticatedRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const resolvedParams = await params;
      const productId = parseInt(resolvedParams.id);

      if (isNaN(productId)) {
        return NextResponse.json(
          { error: 'Invalid product ID' },
          { status: 400 }
        );
      }

      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, name: true, isArchived: true },
      });

      if (!existingProduct) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      // Archive the product instead of deleting
      const archivedProduct = await prisma.product.update({
        where: { id: productId },
        data: { isArchived: true },
        select: {
          id: true,
          name: true,
          sku: true,
          isArchived: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Product archived successfully',
        data: archivedProduct,
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
