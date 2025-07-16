import { auth } from "../../../../../../auth";
import { NextRequest, NextResponse } from "next/server";
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
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Allow all authenticated users to view images
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

    // Handle both legacy string array and new image object array
    let images: any[] = [];

    if (product.images) {
      if (
        Array.isArray(product.images) &&
        typeof product.images[0] === "string"
      ) {
        // Legacy format: string array
        const imageUrls = product.images as string[];
        images = imageUrls.map((url, index) => ({
          id: `legacy-${index}`,
          url: url,
          filename: url.split("/").pop() || `image-${index}`,
          size: 0,
          mimeType: "image/jpeg",
          alt: "",
          isPrimary: index === 0,
          uploadedAt: new Date().toISOString(),
        }));
      } else {
        // New format: image object array
        images = product.images as any[];
      }
    }

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
    const session = await auth();
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
        typeof currentProduct.images[0] === "string"
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
      (currentUrl) => !images.some((newImg) => newImg.url === currentUrl)
    );

    // Clean up removed files from storage
    for (const removedImageUrl of removedImageUrls) {
      if (removedImageUrl && removedImageUrl.includes("supabase.co")) {
        try {
          // Extract storage path from Supabase URL
          const urlParts = removedImageUrl.split("/");
          const storagePath = urlParts.slice(-2).join("/"); // Get folder/filename

          const deleteResponse = await fetch(
            `${request.nextUrl.origin}/api/upload?publicId=${encodeURIComponent(storagePath)}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${session.user.id}`,
              },
            }
          );

          if (!deleteResponse.ok) {
            console.warn(
              "Failed to delete removed file from storage:",
              removedImageUrl
            );
          }
        } catch (error) {
          console.warn("Error deleting removed file from storage:", error);
        }
      }
    }

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

    // Store the full image objects with alt text
    const imageObjects = images.map((img) => ({
      id: img.id,
      url: img.url,
      filename: img.filename,
      size: img.size,
      mimeType: img.mimeType,
      alt: img.alt || "",
      isPrimary: img.isPrimary,
      uploadedAt: img.uploadedAt,
    }));

    // Update the product with image objects
    console.log("Updating product images:", {
      productId,
      imageCount: images.length,
      imageObjects: imageObjects,
    });

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        images: imageObjects.length > 0 ? imageObjects : undefined,
      },
      select: { id: true, name: true, images: true },
    });

    return NextResponse.json({
      message: "Product images updated successfully",
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        images: updatedProduct.images || [],
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
    const session = await auth();
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

    // Get current images for cleanup
    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { images: true },
    });

    if (!currentProduct?.images) {
      return NextResponse.json(
        { error: "No images found for this product" },
        { status: 404 }
      );
    }

    // Extract URLs for cleanup (handle both legacy and new formats)
    let imageUrls: string[] = [];
    if (
      Array.isArray(currentProduct.images) &&
      typeof currentProduct.images[0] === "string"
    ) {
      // Legacy format
      imageUrls = currentProduct.images as string[];
    } else {
      // New format: extract URLs from image objects
      imageUrls = (currentProduct.images as any[]).map((img: any) => img.url);
    }

    // Clean up files from storage
    for (const imageUrl of imageUrls) {
      if (imageUrl && imageUrl.includes("supabase.co")) {
        try {
          // Extract storage path from Supabase URL
          const urlParts = imageUrl.split("/");
          const storagePath = urlParts.slice(-2).join("/"); // Get folder/filename

          const deleteResponse = await fetch(
            `${request.nextUrl.origin}/api/upload?publicId=${encodeURIComponent(storagePath)}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${session.user.id}`,
              },
            }
          );

          if (!deleteResponse.ok) {
            console.warn("Failed to delete file from storage:", imageUrl);
          }
        } catch (error) {
          console.warn("Error deleting file from storage:", error);
        }
      }
    }

    // Remove all images from the product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        images: undefined,
      },
      select: { id: true, name: true, images: true },
    });

    return NextResponse.json({
      message: "All product images deleted successfully",
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        images: updatedProduct.images || [],
      },
    });
  } catch (error) {
    console.error("Error deleting product images:", error);
    return NextResponse.json(
      { error: "Failed to delete product images" },
      { status: 500 }
    );
  }
}
