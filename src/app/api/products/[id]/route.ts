import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  productIdSchema,
  updateProductSchema,
  validateRequest,
} from "@/lib/validations";

interface RouteParams {
  params: { id: string };
}

// GET /api/products/[id] - Get a specific product
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();

    // Validate product ID parameter
    const validation = validateRequest(productIdSchema, {
      id: parseInt(params.id),
    });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid product ID", details: validation.errors },
        { status: 400 }
      );
    }

    const { id } = validation.data!;

    const { data: product, error } = await supabase
      .from("products")
      .select(
        `
        *,
        supplier:suppliers(id, name, contact_person, email, phone)
      `
      )
      .eq("id", id)
      .eq("is_archived", false)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }
      console.error("Error fetching product:", error);
      return NextResponse.json(
        { error: "Failed to fetch product" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error("Error in GET /api/products/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update a product
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    // Validate product ID parameter
    const idValidation = validateRequest(productIdSchema, {
      id: parseInt(params.id),
    });
    if (!idValidation.success) {
      return NextResponse.json(
        { error: "Invalid product ID", details: idValidation.errors },
        { status: 400 }
      );
    }

    // Validate request body
    const bodyValidation = validateRequest(updateProductSchema, body);
    if (!bodyValidation.success) {
      return NextResponse.json(
        { error: "Invalid product data", details: bodyValidation.errors },
        { status: 400 }
      );
    }

    const { id } = idValidation.data!;
    const updateData = bodyValidation.data!;

    // Check if product exists
    const { data: existingProduct } = await supabase
      .from("products")
      .select("id, sku")
      .eq("id", id)
      .single();

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // If SKU is being updated, check for conflicts
    if (updateData.sku && updateData.sku !== existingProduct.sku) {
      const { data: conflictProduct } = await supabase
        .from("products")
        .select("id")
        .eq("sku", updateData.sku)
        .neq("id", id)
        .single();

      if (conflictProduct) {
        return NextResponse.json(
          { error: "Product with this SKU already exists" },
          { status: 409 }
        );
      }
    }

    // Update the product
    const dbUpdateData: any = {};

    // Map form field names to database field names
    if (updateData.name !== undefined) dbUpdateData.name = updateData.name;
    if (updateData.sku !== undefined) dbUpdateData.sku = updateData.sku;
    if (updateData.barcode !== undefined)
      dbUpdateData.barcode = updateData.barcode;
    if (updateData.description !== undefined)
      dbUpdateData.description = updateData.description;
    if (updateData.category !== undefined)
      dbUpdateData.category = updateData.category;
    if (updateData.brand !== undefined) dbUpdateData.brand = updateData.brand;
    if (updateData.purchasePrice !== undefined)
      dbUpdateData.cost = updateData.purchasePrice;
    if (updateData.sellingPrice !== undefined)
      dbUpdateData.price = updateData.sellingPrice;
    if (updateData.minimumStock !== undefined)
      dbUpdateData.min_stock = updateData.minimumStock;
    if (updateData.maximumStock !== undefined)
      dbUpdateData.max_stock = updateData.maximumStock;
    if (updateData.currentStock !== undefined)
      dbUpdateData.stock = updateData.currentStock;
    if (updateData.supplierId !== undefined)
      dbUpdateData.supplier_id = updateData.supplierId;
    if (updateData.status !== undefined)
      dbUpdateData.status = updateData.status;
    if (updateData.imageUrl !== undefined) {
      dbUpdateData.images = updateData.imageUrl
        ? [{ url: updateData.imageUrl, isPrimary: true }]
        : null;
    }

    const { data: product, error } = await supabase
      .from("products")
      .update(dbUpdateData)
      .eq("id", id)
      .select(
        `
        *,
        supplier:suppliers(id, name)
      `
      )
      .single();

    if (error) {
      console.error("Error updating product:", error);
      return NextResponse.json(
        { error: "Failed to update product" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error("Error in PUT /api/products/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete (archive) a product
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();

    // Validate product ID parameter
    const validation = validateRequest(productIdSchema, {
      id: parseInt(params.id),
    });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid product ID", details: validation.errors },
        { status: 400 }
      );
    }

    const { id: productId } = validation.data!;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get("hard") === "true";

    // Check if product exists
    const { data: existingProduct } = await supabase
      .from("products")
      .select("id, name")
      .eq("id", productId)
      .single();

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (hardDelete) {
      // Check for related records that would prevent deletion
      const { data: salesItems } = await supabase
        .from("sales_items")
        .select("id")
        .eq("productId", productId)
        .limit(1);

      if (salesItems && salesItems.length > 0) {
        return NextResponse.json(
          {
            error:
              "Cannot delete product with existing sales records. Use archive instead.",
          },
          { status: 409 }
        );
      }

      // Hard delete
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json(
          { error: "Failed to delete product" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Product deleted successfully",
      });
    } else {
      // Soft delete (archive)
      const { data: product, error } = await supabase
        .from("products")
        .update({ is_archived: true })
        .eq("id", productId)
        .select("id, name, is_archived")
        .single();

      if (error) {
        console.error("Error archiving product:", error);
        return NextResponse.json(
          { error: "Failed to archive product" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        data: product,
        message: "Product archived successfully",
      });
    }
  } catch (error) {
    console.error("Error in DELETE /api/products/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
