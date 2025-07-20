import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { withPOSAuth, AuthenticatedRequest } from "@/lib/api-auth-middleware";
import { PRODUCT_STATUS, ERROR_MESSAGES } from "@/lib/constants";

// Validation schema for barcode lookup
const barcodeSchema = z.object({
  barcode: z.string().min(1, "Barcode is required"),
});

async function handleBarcodeSearch(request: AuthenticatedRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const validatedParams = barcodeSchema.parse({
      barcode: searchParams.get("barcode"),
    });

    const { barcode } = validatedParams;

    // Look up product by barcode
    const product = await prisma.product.findFirst({
      where: {
        barcode: barcode,
        status: PRODUCT_STATUS.ACTIVE,
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
        { error: ERROR_MESSAGES.NOT_FOUND },
        { status: 404 }
      );
    }

    // Format response
    const formattedProduct = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      price: product.price,
      stock: product.stock,
      status: product.status,
      category: product.category,
      brand: product.brand,
    };

    return NextResponse.json(formattedProduct);
  } catch (error) {
    console.error("Error looking up barcode:", error);

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
