import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { validateRequest } from "@/lib/validations/common";
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
    const supabase = await createServerSupabaseClient();
    const { id: paramId } = await params;
    const body = await request.json();

    // Validate request
    const validation = validateRequest(archiveProductSchema, {
      productId: parseInt(paramId),
      ...body,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.errors },
        { status: 400 }
      );
    }

    const { productId, archived, reason } = validation.data!;

    // Check if product exists
    const { data: existingProduct, error: fetchError } = await supabase
      .from("products")
      .select("id, name, is_archived, status")
      .eq("id", productId)
      .single();

    if (fetchError || !existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if already in requested state
    if (existingProduct.is_archived === archived) {
      return NextResponse.json(
        {
          error: `Product is already ${archived ? "archived" : "active"}`,
        },
        { status: 400 }
      );
    }

    // Update product archive status
    const { data: updatedProduct, error: updateError } = await supabase
      .from("products")
      .update({
        is_archived: archived,
        archived_at: archived ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .select("id, name, is_archived, status, archived_at")
      .single();

    if (updateError) {
      console.error("Error updating product archive status:", updateError);
      return NextResponse.json(
        { error: "Failed to update product status" },
        { status: 500 }
      );
    }

    // Log the archive/unarchive action
    if (reason) {
      await supabase.from("audit_logs").insert({
        table_name: "products",
        record_id: productId,
        action: archived ? "ARCHIVE" : "UNARCHIVE",
        changes: {
          is_archived: archived,
          reason,
        },
        created_at: new Date().toISOString(),
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
