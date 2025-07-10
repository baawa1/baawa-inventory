import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Archive/Unarchive product endpoint
const archiveProductSchema = z.object({
  productId: z.number().positive(),
  archived: z.boolean(),
  reason: z.string().optional(),
});

// PATCH /api/products/[id]/archive - Archive or unarchive a product
export async function PATCH(
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

    const { id: paramId } = await params;
    const body = await request.json();
    const productId = parseInt(paramId);

    // Validate request
    const validatedData = archiveProductSchema.parse({
      productId,
      ...body,
    });

    const { archived, reason } = validatedData;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, isArchived: true, status: true },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if already in requested state
    if (existingProduct.isArchived === archived) {
      return NextResponse.json(
        {
          error: `Product is already ${archived ? "archived" : "active"}`,
        },
        { status: 400 }
      );
    }

    // Update product archive status
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        isArchived: archived,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        isArchived: true,
        status: true,
      },
    });

    // Log the archive/unarchive action
    if (reason) {
      await prisma.auditLog.create({
        data: {
          user_id: parseInt(session.user.id),
          action: archived ? "ARCHIVE" : "UNARCHIVE",
          table_name: "products",
          record_id: productId,
          new_values: {
            isArchived: archived,
            reason,
          },
          created_at: new Date(),
        },
      });
    }

    return NextResponse.json({
      data: updatedProduct,
      message: `Product ${archived ? "archived" : "unarchived"} successfully`,
    });
  } catch (error) {
    console.error("Error in PATCH /api/products/[id]/archive:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
