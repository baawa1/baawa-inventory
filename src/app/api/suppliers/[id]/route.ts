import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  supplierIdSchema,
  updateSupplierSchema,
  validateRequest,
} from "@/lib/validations";

interface RouteParams {
  params: { id: string };
}

// GET /api/suppliers/[id] - Get a specific supplier
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = params;

    // Validate ID
    const supplierId = parseInt(id);
    if (isNaN(supplierId)) {
      return NextResponse.json(
        { error: "Invalid supplier ID" },
        { status: 400 }
      );
    }

    const { data: supplier, error } = await supabase
      .from("suppliers")
      .select(
        `
        *,
        products:products(
          id,
          name,
          sku,
          category,
          price,
          stock,
          status,
          createdAt
        ),
        purchaseOrders:purchase_orders(
          id,
          orderNumber,
          status,
          totalAmount,
          orderDate,
          expectedDelivery
        )
      `
      )
      .eq("id", supplierId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Supplier not found" },
          { status: 404 }
        );
      }
      console.error("Error fetching supplier:", error);
      return NextResponse.json(
        { error: "Failed to fetch supplier" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: supplier });
  } catch (error) {
    console.error("Error in GET /api/suppliers/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/suppliers/[id] - Update a supplier
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = params;
    const body = await request.json();

    // Validate ID
    const supplierId = parseInt(id);
    if (isNaN(supplierId)) {
      return NextResponse.json(
        { error: "Invalid supplier ID" },
        { status: 400 }
      );
    }

    // Check if supplier exists
    const { data: existingSupplier } = await supabase
      .from("suppliers")
      .select("id, name")
      .eq("id", supplierId)
      .single();

    if (!existingSupplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // If name is being updated, check for conflicts
    if (body.name && body.name !== existingSupplier.name) {
      const { data: conflictSupplier } = await supabase
        .from("suppliers")
        .select("id")
        .eq("name", body.name)
        .neq("id", supplierId)
        .single();

      if (conflictSupplier) {
        return NextResponse.json(
          { error: "Supplier with this name already exists" },
          { status: 409 }
        );
      }
    }

    // Validate email format if provided
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    // Update the supplier
    const { data: supplier, error } = await supabase
      .from("suppliers")
      .update(body)
      .eq("id", supplierId)
      .select("*")
      .single();

    if (error) {
      console.error("Error updating supplier:", error);
      return NextResponse.json(
        { error: "Failed to update supplier" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: supplier });
  } catch (error) {
    console.error("Error in PUT /api/suppliers/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/suppliers/[id] - Delete or deactivate a supplier
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get("hard") === "true";

    // Validate ID
    const supplierId = parseInt(id);
    if (isNaN(supplierId)) {
      return NextResponse.json(
        { error: "Invalid supplier ID" },
        { status: 400 }
      );
    }

    // Check if supplier exists
    const { data: existingSupplier } = await supabase
      .from("suppliers")
      .select("id, name")
      .eq("id", supplierId)
      .single();

    if (!existingSupplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    if (hardDelete) {
      // Check for related records that would prevent deletion
      const { data: products } = await supabase
        .from("products")
        .select("id")
        .eq("supplierId", supplierId)
        .limit(1);

      if (products && products.length > 0) {
        return NextResponse.json(
          {
            error:
              "Cannot delete supplier with existing products. Use deactivation instead.",
          },
          { status: 409 }
        );
      }

      // Hard delete
      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", supplierId);

      if (error) {
        console.error("Error deleting supplier:", error);
        return NextResponse.json(
          { error: "Failed to delete supplier" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Supplier deleted successfully",
      });
    } else {
      // Soft delete (deactivate)
      const { data: supplier, error } = await supabase
        .from("suppliers")
        .update({ isActive: false })
        .eq("id", supplierId)
        .select("id, name, isActive")
        .single();

      if (error) {
        console.error("Error deactivating supplier:", error);
        return NextResponse.json(
          { error: "Failed to deactivate supplier" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        data: supplier,
        message: "Supplier deactivated successfully",
      });
    }
  } catch (error) {
    console.error("Error in DELETE /api/suppliers/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
