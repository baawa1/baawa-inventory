import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { brandIdSchema, updateBrandSchema } from "@/lib/validations/brand";

// GET /api/brands/[id] - Get a specific brand
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params first, then validate brand ID
    const resolvedParams = await params;
    const { id } = brandIdSchema.parse(resolvedParams);

    const supabase = await createServerSupabaseClient();

    const { data: brand, error } = await supabase
      .from("brands")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Brand not found" }, { status: 404 });
      }
      console.error("Error fetching brand:", error);
      return NextResponse.json(
        { error: "Failed to fetch brand" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      brand,
    });
  } catch (error) {
    console.error("Get brand API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/brands/[id] - Update a specific brand
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params first, then validate brand ID
    const resolvedParams = await params;
    const { id } = brandIdSchema.parse(resolvedParams);

    const body = await request.json();
    const validatedData = updateBrandSchema.parse({ ...body, id });

    const supabase = await createServerSupabaseClient();

    // Check if brand exists
    const { data: existingBrand } = await supabase
      .from("brands")
      .select("id")
      .eq("id", id)
      .single();

    if (!existingBrand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Check if name is already taken by another brand
    if (validatedData.name) {
      const { data: nameCheck } = await supabase
        .from("brands")
        .select("id")
        .eq("name", validatedData.name)
        .neq("id", id)
        .single();

      if (nameCheck) {
        return NextResponse.json(
          { error: "Brand name already exists" },
          { status: 400 }
        );
      }
    }

    // Update the brand
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([key]) => key !== "id")
    );

    // Transform form data (handle both isActive and is_active)
    const transformedData = { ...updateData };
    if ("isActive" in transformedData) {
      transformedData.is_active = (transformedData as any).isActive;
      delete (transformedData as any).isActive;
    }

    const dataToUpdate = {
      ...transformedData,
      updated_at: new Date().toISOString(),
    };

    const { data: brand, error } = await supabase
      .from("brands")
      .update(dataToUpdate)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Error updating brand:", error);
      return NextResponse.json(
        { error: "Failed to update brand" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      brand,
    });
  } catch (error) {
    console.error("Update brand API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/brands/[id] - Delete a specific brand
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params first, then validate brand ID
    const resolvedParams = await params;
    const { id } = brandIdSchema.parse(resolvedParams);

    const supabase = await createServerSupabaseClient();

    // Check if brand exists
    const { data: existingBrand } = await supabase
      .from("brands")
      .select("id")
      .eq("id", id)
      .single();

    if (!existingBrand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Check if brand is being used by products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id")
      .eq("brand_id", id)
      .limit(1);

    if (productsError) {
      console.error("Error checking product references:", productsError);
      return NextResponse.json(
        { error: "Failed to check brand usage" },
        { status: 500 }
      );
    }

    if (products && products.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete brand that is being used by products" },
        { status: 400 }
      );
    }

    // Delete the brand
    const { error } = await supabase.from("brands").delete().eq("id", id);

    if (error) {
      console.error("Error deleting brand:", error);
      return NextResponse.json(
        { error: "Failed to delete brand" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error) {
    console.error("Delete brand API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
