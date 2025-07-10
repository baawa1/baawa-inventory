import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Schema for barcode operations
const barcodeGenerateSchema = z.object({
  productIds: z.array(z.number()).min(1, "At least one product ID is required"),
  prefix: z.string().optional().default(""),
  format: z.enum(["EAN13", "CODE128", "AUTO"]).default("AUTO"),
});

const barcodeValidateSchema = z.object({
  barcode: z.string().min(8, "Barcode must be at least 8 characters"),
});

// Function to generate barcode based on format
function generateBarcode(
  productId: number,
  format: string,
  prefix: string = ""
): string {
  const timestamp = Date.now().toString().slice(-6);
  const productIdStr = productId.toString().padStart(4, "0");

  switch (format) {
    case "EAN13":
      // Generate 13-digit EAN barcode
      const ean13Base = `${prefix}${productIdStr}${timestamp}`.slice(0, 12);
      // Simple checksum calculation (not actual EAN13 algorithm)
      const checksum =
        ean13Base.split("").reduce((sum, digit) => sum + parseInt(digit), 0) %
        10;
      return ean13Base + checksum;

    case "CODE128":
      // Generate CODE128 format
      return `${prefix}${productIdStr}${timestamp}`;

    case "AUTO":
    default:
      // Auto format - simple concatenation
      return `${prefix}${productIdStr}${timestamp}`.slice(0, 13);
  }
}

// POST /api/products/barcodes - Generate barcodes for products
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permissions
    if (!["ADMIN", "MANAGER"].includes(session.user.role as string)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === "generate") {
      const validatedData = barcodeGenerateSchema.parse(body);

      // Check if products exist
      const products = await prisma.product.findMany({
        where: { id: { in: validatedData.productIds } },
        select: { id: true, name: true, barcode: true },
      });

      if (products.length !== validatedData.productIds.length) {
        const foundIds = products.map((p) => p.id);
        const missingIds = validatedData.productIds.filter(
          (id) => !foundIds.includes(id)
        );
        return NextResponse.json(
          { error: `Products not found: ${missingIds.join(", ")}` },
          { status: 404 }
        );
      }

      // Generate barcodes for products that don't have them
      const updates = [];
      const results = [];

      for (const product of products) {
        if (!product.barcode) {
          let newBarcode: string;
          let attempts = 0;
          const maxAttempts = 10;

          // Generate unique barcode
          do {
            newBarcode = generateBarcode(
              product.id,
              validatedData.format,
              validatedData.prefix
            );
            attempts++;

            // Check if barcode already exists
            const existing = await prisma.product.findFirst({
              where: { barcode: newBarcode },
              select: { id: true },
            });

            if (!existing) break;
          } while (attempts < maxAttempts);

          if (attempts >= maxAttempts) {
            return NextResponse.json(
              {
                error: `Failed to generate unique barcode for product ${product.id}`,
              },
              { status: 500 }
            );
          }

          updates.push(
            prisma.product.update({
              where: { id: product.id },
              data: { barcode: newBarcode },
            })
          );

          results.push({
            productId: product.id,
            productName: product.name,
            barcode: newBarcode,
            status: "generated",
          });
        } else {
          results.push({
            productId: product.id,
            productName: product.name,
            barcode: product.barcode,
            status: "existing",
          });
        }
      }

      // Execute all updates
      if (updates.length > 0) {
        await prisma.$transaction(updates);
      }

      return NextResponse.json({
        message: `Processed ${results.length} products`,
        results,
        generated: results.filter((r) => r.status === "generated").length,
        existing: results.filter((r) => r.status === "existing").length,
      });
    } else if (action === "validate") {
      const validatedData = barcodeValidateSchema.parse(body);

      // Check if barcode exists
      const existingProduct = await prisma.product.findFirst({
        where: { barcode: validatedData.barcode },
        select: {
          id: true,
          name: true,
          sku: true,
          barcode: true,
        },
      });

      return NextResponse.json({
        barcode: validatedData.barcode,
        exists: !!existingProduct,
        product: existingProduct || null,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'generate' or 'validate'" },
        { status: 400 }
      );
    }
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

    console.error("Error in barcode operation:", error);
    return NextResponse.json(
      { error: "Failed to process barcode operation" },
      { status: 500 }
    );
  }
}

// GET /api/products/barcodes - Get barcode statistics
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permissions
    if (!["ADMIN", "MANAGER", "STAFF"].includes(session.user.role as string)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get barcode statistics
    const totalProducts = await prisma.product.count({
      where: { isArchived: false },
    });

    const productsWithBarcodes = await prisma.product.count({
      where: {
        isArchived: false,
        barcode: { not: null },
      },
    });

    const productsWithoutBarcodes = await prisma.product.findMany({
      where: {
        isArchived: false,
        OR: [{ barcode: null }, { barcode: "" }],
      },
      select: {
        id: true,
        name: true,
        sku: true,
      },
      take: 50, // Limit to first 50 for performance
    });

    return NextResponse.json({
      statistics: {
        totalProducts,
        withBarcodes: productsWithBarcodes,
        withoutBarcodes: totalProducts - productsWithBarcodes,
        coveragePercentage:
          totalProducts > 0
            ? Math.round((productsWithBarcodes / totalProducts) * 100)
            : 0,
      },
      productsWithoutBarcodes: {
        items: productsWithoutBarcodes,
        hasMore: productsWithoutBarcodes.length === 50,
      },
    });
  } catch (error) {
    console.error("Error getting barcode statistics:", error);
    return NextResponse.json(
      { error: "Failed to get barcode statistics" },
      { status: 500 }
    );
  }
}
