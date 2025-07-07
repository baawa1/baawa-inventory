import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for barcode lookup
const barcodeSchema = z.object({
  barcode: z.string().min(1, "Barcode is required"),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user status and role (POS requires at least STAFF role)
    const user = session.user;
    if (user.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Account not approved" },
        { status: 403 }
      );
    }

    if (!["ADMIN", "MANAGER", "STAFF"].includes(user.role || "")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

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
        status: "active",
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
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
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
        { error: "Invalid barcode", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
