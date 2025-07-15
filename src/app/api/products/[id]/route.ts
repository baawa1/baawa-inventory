import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

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
  salePrice: z.number().min(0).optional().nullable(),
  saleStartDate: z.string().datetime().optional().nullable(),
  saleEndDate: z.string().datetime().optional().nullable(),
  metaTitle: z.string().max(255).optional().nullable(),
  metaDescription: z.string().max(500).optional().nullable(),
  seoKeywords: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().optional().nullable(),
  // Note: images field is handled separately via /api/products/[id]/images endpoint
});

// GET /api/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Account not approved" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        brand: true,
        supplier: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let productId: number = 0;
  const updateData: any = {};

  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Account not approved" },
        { status: 403 }
      );
    }

    // Check permissions
    if (!["ADMIN", "MANAGER"].includes(session.user.role as string)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    productId = parseInt(resolvedParams.id);
    const body = await request.json();

    const validatedData = ProductUpdateSchema.parse(body);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check for SKU conflicts if SKU is being updated
    if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findFirst({
        where: {
          sku: validatedData.sku,
          id: { not: productId },
        },
      });

      if (skuExists) {
        return NextResponse.json(
          { error: "Product with this SKU already exists" },
          { status: 400 }
        );
      }
    }

    // Check for barcode conflicts if barcode is being updated
    if (
      validatedData.barcode &&
      validatedData.barcode !== existingProduct.barcode
    ) {
      const barcodeExists = await prisma.product.findFirst({
        where: {
          barcode: validatedData.barcode,
          id: { not: productId },
        },
      });

      if (barcodeExists) {
        return NextResponse.json(
          { error: "Product with this barcode already exists" },
          { status: 400 }
        );
      }
    }

    // Map frontend field names to database field names

    // Direct mappings
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
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
    if (validatedData.status !== undefined)
      updateData.status = validatedData.status;
    if (validatedData.isArchived !== undefined)
      updateData.isArchived = validatedData.isArchived;
    if (validatedData.unit !== undefined) updateData.unit = validatedData.unit;
    if (validatedData.weight !== undefined)
      updateData.weight = validatedData.weight;
    if (validatedData.dimensions !== undefined)
      updateData.dimensions = validatedData.dimensions;
    if (validatedData.color !== undefined)
      updateData.color = validatedData.color;
    if (validatedData.size !== undefined) updateData.size = validatedData.size;
    if (validatedData.material !== undefined)
      updateData.material = validatedData.material;
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags;
    if (validatedData.salePrice !== undefined)
      updateData.salePrice = validatedData.salePrice;
    if (validatedData.saleStartDate !== undefined)
      updateData.saleStartDate = validatedData.saleStartDate;
    if (validatedData.saleEndDate !== undefined)
      updateData.saleEndDate = validatedData.saleEndDate;
    if (validatedData.metaTitle !== undefined)
      updateData.metaTitle = validatedData.metaTitle;
    if (validatedData.metaDescription !== undefined)
      updateData.metaDescription = validatedData.metaDescription;
    if (validatedData.seoKeywords !== undefined)
      updateData.seoKeywords = validatedData.seoKeywords;
    if (validatedData.isFeatured !== undefined)
      updateData.isFeatured = validatedData.isFeatured;
    if (validatedData.sortOrder !== undefined)
      updateData.sortOrder = validatedData.sortOrder;

    // Note: images field is handled separately via /api/products/[id]/images endpoint
    // to avoid schema conflicts between String[] and Json types

    // Field name mappings (frontend -> database)
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

    // Also handle direct database field names if provided
    if (validatedData.cost !== undefined) updateData.cost = validatedData.cost;
    if (validatedData.price !== undefined)
      updateData.price = validatedData.price;
    if (validatedData.stock !== undefined)
      updateData.stock = validatedData.stock;
    if (validatedData.minStock !== undefined)
      updateData.minStock = validatedData.minStock;
    if (validatedData.maxStock !== undefined)
      updateData.maxStock = validatedData.maxStock;

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: true,
        brand: true,
        supplier: true,
      },
    });

    return NextResponse.json({
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Log detailed error information
    console.error("Error updating product:", {
      error: error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      productId,
      updateData: updateData || "No update data",
    });

    // Return more specific error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "A product with this SKU or barcode already exists" },
          { status: 400 }
        );
      }
      if (error.message.includes("Foreign key constraint")) {
        return NextResponse.json(
          { error: "Invalid category, brand, or supplier ID" },
          { status: 400 }
        );
      }
      if (error.message.includes("Invalid value")) {
        return NextResponse.json(
          { error: "Invalid data format provided" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete/Archive product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Account not approved" },
        { status: 403 }
      );
    }

    // Only admins can delete products
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    // Archive the product instead of deleting
    const archivedProduct = await prisma.product.update({
      where: { id: productId },
      data: { isArchived: true },
    });

    return NextResponse.json({
      message: "Product archived successfully",
      data: archivedProduct,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
