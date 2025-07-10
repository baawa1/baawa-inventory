import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Schema for bulk archive operations
const bulkArchiveSchema = z.object({
  productIds: z.array(z.number()).min(1, "At least one product ID is required"),
  action: z.enum(["archive", "unarchive"], {
    required_error: "Action must be either 'archive' or 'unarchive'",
  }),
});

// POST /api/products/archive - Bulk archive/unarchive products
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
    const validatedData = bulkArchiveSchema.parse(body);

    // Check if all products exist
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: validatedData.productIds } },
      select: { id: true, name: true, isArchived: true },
    });

    if (existingProducts.length !== validatedData.productIds.length) {
      const foundIds = existingProducts.map((p) => p.id);
      const missingIds = validatedData.productIds.filter(
        (id) => !foundIds.includes(id)
      );
      return NextResponse.json(
        { error: `Products not found: ${missingIds.join(", ")}` },
        { status: 404 }
      );
    }

    // Perform bulk update
    const isArchived = validatedData.action === "archive";
    const updatedProducts = await prisma.product.updateMany({
      where: { id: { in: validatedData.productIds } },
      data: { isArchived },
    });

    const actionText = isArchived ? "archived" : "unarchived";

    return NextResponse.json({
      message: `Successfully ${actionText} ${updatedProducts.count} products`,
      count: updatedProducts.count,
      action: validatedData.action,
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

    console.error("Error in bulk archive operation:", error);
    return NextResponse.json(
      { error: "Failed to archive products" },
      { status: 500 }
    );
  }
}
