import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  supplierIdSchema,
  updateSupplierSchema,
  validateRequest,
} from "@/lib/validations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/suppliers/[id] - Get a specific supplier
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = await params;

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
      .select("*")
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

    // Transform database field names to frontend field names
    const transformedSupplier = {
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      state: supplier.state,
      country: supplier.country,
      postalCode: supplier.postal_code,
      taxId: supplier.tax_number,
      paymentTerms: supplier.payment_terms,
      creditLimit: supplier.credit_limit,
      isActive: supplier.is_active,
      notes: supplier.notes,
      createdAt: supplier.created_at,
      updatedAt: supplier.updated_at,
    };

    return NextResponse.json({ data: transformedSupplier });
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
    const { id } = await params;
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

    // Map frontend field names to database field names
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.contactPerson !== undefined)
      updateData.contact_person = body.contactPerson;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.country !== undefined) updateData.country = body.country;
    if (body.postalCode !== undefined) updateData.postal_code = body.postalCode;
    if (body.taxId !== undefined) updateData.tax_number = body.taxId;
    if (body.paymentTerms !== undefined)
      updateData.payment_terms = body.paymentTerms;
    if (body.creditLimit !== undefined)
      updateData.credit_limit = body.creditLimit;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;
    if (body.notes !== undefined) updateData.notes = body.notes;

    // Update the supplier
    const { data: supplier, error } = await supabase
      .from("suppliers")
      .update(updateData)
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

    // Transform database field names to frontend field names
    const transformedSupplier = {
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      state: supplier.state,
      country: supplier.country,
      postalCode: supplier.postal_code,
      taxId: supplier.tax_number,
      paymentTerms: supplier.payment_terms,
      creditLimit: supplier.credit_limit,
      isActive: supplier.is_active,
      notes: supplier.notes,
      createdAt: supplier.created_at,
      updatedAt: supplier.updated_at,
    };

    return NextResponse.json({ data: transformedSupplier });
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
    const { id } = await params;
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
        .eq("supplier_id", supplierId)
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
        .update({ is_active: false })
        .eq("id", supplierId)
        .select("id, name, is_active")
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

// PATCH /api/suppliers/[id] - Update supplier status or other fields
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = await params;

    // Validate ID
    const supplierId = parseInt(id);
    if (isNaN(supplierId)) {
      return NextResponse.json(
        { error: "Invalid supplier ID" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Check if this is a status update (reactivation/deactivation)
    if (body.hasOwnProperty("isActive")) {
      const { data: supplier, error } = await supabase
        .from("suppliers")
        .update({ is_active: body.isActive })
        .eq("id", supplierId)
        .select("id, name, is_active")
        .single();

      if (error) {
        console.error("Error updating supplier status:", error);
        return NextResponse.json(
          { error: "Failed to update supplier status" },
          { status: 500 }
        );
      }

      const action = body.isActive ? "reactivated" : "deactivated";
      return NextResponse.json({
        data: supplier,
        message: `Supplier ${action} successfully`,
      });
    }

    // Handle other patch operations (can be extended later)
    return NextResponse.json(
      { error: "Invalid patch operation" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in PATCH /api/suppliers/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
