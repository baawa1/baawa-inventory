import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Schema for image data
const imageSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  filename: z.string(),
  size: z.number(),
  mimeType: z.string(),
  alt: z.string().optional(),
  isPrimary: z.boolean().default(false),
  uploadedAt: z.string().datetime(),
});

const updateImagesSchema = z.object({
  images: z.array(imageSchema),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const productId = parseInt(id);
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, images: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const images = product.images ? (product.images as any[]) : [];

    return NextResponse.json({
      productId: product.id,
      productName: product.name,
      images,
    });
  } catch (error) {
    console.error("Error fetching product images:", error);
    return NextResponse.json(
      { error: "Failed to fetch product images" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const productId = parseInt(id);
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { images } = updateImagesSchema.parse(body);

    // Ensure only one image is marked as primary
    const primaryImages = images.filter((img) => img.isPrimary);
    if (primaryImages.length > 1) {
      return NextResponse.json(
        { error: "Only one image can be marked as primary" },
        { status: 400 }
      );
    }

    // If no primary image is set and there are images, set the first one as primary
    if (primaryImages.length === 0 && images.length > 0) {
      images[0].isPrimary = true;
    }

    // Update the product with new images
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        images: images.length > 0 ? images : undefined,
      },
      select: { id: true, name: true, images: true },
    });

    return NextResponse.json({
      message: "Product images updated successfully",
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        images: updatedProduct.images,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid image data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating product images:", error);
    return NextResponse.json(
      { error: "Failed to update product images" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const productId = parseInt(id);
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("imageId");

    if (!imageId) {
      return NextResponse.json(
        { error: "Image ID is required" },
        { status: 400 }
      );
    }

    // Get current product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { images: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const currentImages = product.images ? (product.images as any[]) : [];
    const updatedImages = currentImages.filter((img) => img.id !== imageId);

    // If we removed the primary image, make the first remaining image primary
    if (
      updatedImages.length > 0 &&
      !updatedImages.some((img) => img.isPrimary)
    ) {
      updatedImages[0].isPrimary = true;
    }

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        images: updatedImages.length > 0 ? updatedImages : undefined,
      },
      select: { id: true, name: true, images: true },
    });

    return NextResponse.json({
      message: "Image deleted successfully",
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        images: updatedProduct.images,
      },
    });
  } catch (error) {
    console.error("Error deleting product image:", error);
    return NextResponse.json(
      { error: "Failed to delete product image" },
      { status: 500 }
    );
  }
}
