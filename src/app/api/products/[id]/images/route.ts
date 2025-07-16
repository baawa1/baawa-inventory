import { auth } from "../../../../../../auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Schema for image data - handle both formats
const imageSchema = z.object({
  id: z.string().optional(),
  url: z.string().url(),
  filename: z.string().optional(),
  size: z.number().optional(),
  mimeType: z.string().optional(),
  alt: z.string().optional(),
  altText: z.string().optional(), // Support both alt and altText
  isPrimary: z.boolean().optional(),
  uploadedAt: z.string().datetime().optional(),
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
        // New format: image object array - handle different property names
        const imageObjects = product.images as any[];
        images = imageObjects.map((img, index) => ({
          id: img.id || `restored-${index}`,
          url: img.url,
          filename:
            img.filename || img.url.split("/").pop() || `image-${index}`,
          size: img.size || 0,
          mimeType: img.mimeType || "image/jpeg",
          alt: img.alt || img.altText || "",
          isPrimary: img.isPrimary !== undefined ? img.isPrimary : index === 0, // First image is primary by default
          uploadedAt: img.uploadedAt || new Date().toISOString(),
        }));
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

    // Store the full image objects with alt text and isPrimary - normalize to current format
    const imageObjects = images.map((img, index) => ({
      url: img.url,
      altText: img.alt || img.altText || "",
      isPrimary: img.isPrimary !== undefined ? img.isPrimary : index === 0, // Only set default if isPrimary is not explicitly set
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
        images: imageObjects.length > 0 ? (imageObjects as any) : undefined,
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

    // Get the imageUrl from query parameters
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("imageUrl");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Get current images
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

    // Handle both legacy and new formats
    let currentImages: any[] = [];
    if (
      Array.isArray(currentProduct.images) &&
      typeof currentProduct.images[0] === "string"
    ) {
      // Legacy format: convert to new format for processing
      currentImages = (currentProduct.images as string[]).map((url, index) => ({
        url,
        filename: url.split("/").pop() || `image-${index}`,
        mimeType: "image/jpeg",
        alt: "",
        isPrimary: index === 0,
        uploadedAt: new Date().toISOString(),
      }));
    } else {
      // New format
      currentImages = currentProduct.images as any[];
    }

    // Find the image to delete by URL
    const imageToDelete = currentImages.find((img) => img.url === imageUrl);
    if (!imageToDelete) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Remove the image from the array
    const updatedImages = currentImages.filter((img) => img.url !== imageUrl);

    // If we deleted the primary image and there are other images, make the first one primary
    if (imageToDelete.isPrimary && updatedImages.length > 0) {
      updatedImages[0].isPrimary = true;
    }

    // Clean up the deleted file from storage
    if (imageToDelete.url && imageToDelete.url.includes("supabase.co")) {
      try {
        // Extract storage path from Supabase URL
        const urlParts = imageToDelete.url.split("/");
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
            "Failed to delete file from storage:",
            imageToDelete.url
          );
        }
      } catch (error) {
        console.warn("Error deleting file from storage:", error);
      }
    }

    // Convert back to the format stored in the database
    const imageObjects = updatedImages.map((img) => ({
      url: img.url,
      altText: img.alt || img.altText || "",
      isPrimary: img.isPrimary,
    }));

    // Update the product with the remaining images
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        images: imageObjects.length > 0 ? (imageObjects as any) : undefined,
      },
      select: { id: true, name: true, images: true },
    });

    return NextResponse.json({
      message: "Image deleted successfully",
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        images: updatedProduct.images || [],
      },
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
