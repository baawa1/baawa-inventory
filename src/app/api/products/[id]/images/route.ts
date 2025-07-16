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

    const imageUrls = product.images ? (product.images as string[]) : [];

    // Convert string URLs to the expected format for the frontend
    // The first image in the array is considered the primary image
    const images = imageUrls.map((url, index) => ({
      id: `legacy-${index}`,
      url: url,
      filename: url.split("/").pop() || `image-${index}`,
      size: 0,
      mimeType: "image/jpeg",
      alt: "",
      isPrimary: index === 0, // First image is always primary
      uploadedAt: new Date().toISOString(),
    }));

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

    const currentImageUrls = currentProduct?.images
      ? (currentProduct.images as string[])
      : [];

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

    // Convert image objects back to string array for database storage
    // Put the primary image first in the array
    const primaryImage = images.find((img) => img.isPrimary);
    const nonPrimaryImages = images.filter((img) => !img.isPrimary);

    const imageUrls = primaryImage
      ? [primaryImage.url, ...nonPrimaryImages.map((img) => img.url)]
      : images.map((img) => img.url);

    // Update the product with new images
    console.log("Updating product images:", {
      productId,
      imageCount: images.length,
      imageUrls: imageUrls,
    });

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        images: imageUrls.length > 0 ? imageUrls : undefined,
      },
      select: { id: true, name: true, images: true },
    });

    // Convert string URLs back to the expected format for the frontend
    const updatedImageUrls = updatedProduct.images
      ? (updatedProduct.images as string[])
      : [];
    const updatedImages = updatedImageUrls.map((url, index) => ({
      id: `legacy-${index}`,
      url: url,
      filename: url.split("/").pop() || `image-${index}`,
      size: 0,
      mimeType: "image/jpeg",
      alt: "",
      isPrimary: index === 0,
      uploadedAt: new Date().toISOString(),
    }));

    return NextResponse.json({
      message: "Product images updated successfully",
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        images: updatedImages,
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

    const currentImageUrls = product.images ? (product.images as string[]) : [];
    const imageToDeleteUrl =
      currentImageUrls[parseInt(imageId.replace("legacy-", ""))];

    if (!imageToDeleteUrl) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Delete file from storage if it's a Supabase Storage URL
    if (imageToDeleteUrl && imageToDeleteUrl.includes("supabase.co")) {
      try {
        // Extract storage path from Supabase URL
        const urlParts = imageToDeleteUrl.split("/");
        const storagePath = urlParts.slice(-2).join("/"); // Get folder/filename

        const deleteResponse = await fetch(
          `${request.nextUrl.origin}/api/upload?publicId=${encodeURIComponent(storagePath)}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${session.user.id}`, // Pass user context
            },
          }
        );

        if (!deleteResponse.ok) {
          console.warn(
            "Failed to delete file from storage, but continuing with database update"
          );
        }
      } catch (error) {
        console.warn("Error deleting file from storage:", error);
        // Continue with database update even if storage deletion fails
      }
    }

    // Remove the image URL from the array
    const imageIndex = parseInt(imageId.replace("legacy-", ""));
    const updatedImageUrls = currentImageUrls.filter(
      (_, index) => index !== imageIndex
    );

    // If we deleted the primary image (index 0) and there are remaining images,
    // the new first image becomes primary automatically

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        images: updatedImageUrls.length > 0 ? updatedImageUrls : undefined,
      },
      select: { id: true, name: true, images: true },
    });

    // Convert string URLs back to the expected format for the frontend
    const imageUrls = updatedProduct.images
      ? (updatedProduct.images as string[])
      : [];
    const images = imageUrls.map((url, index) => ({
      id: `legacy-${index}`,
      url: url,
      filename: url.split("/").pop() || `image-${index}`,
      size: 0,
      mimeType: "image/jpeg",
      alt: "",
      isPrimary: index === 0,
      uploadedAt: new Date().toISOString(),
    }));

    return NextResponse.json({
      message: "Image deleted successfully",
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        images: images,
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
