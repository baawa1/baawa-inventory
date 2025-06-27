import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { brandQuerySchema, createBrandSchema } from "@/lib/validations/brand";

// GET /api/brands - List brands with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Check if this is a legacy request for product brands (dropdown)
    const legacy = searchParams.get("legacy") === "true";

    if (legacy) {
      // Legacy functionality: Get unique brands from products for dropdowns
      // First check if products table has brand column or brand_id
      const supabase = await createServerSupabaseClient();
      const { data: products, error } = await supabase
        .from("products")
        .select("brand")
        .not("brand", "is", null)
        .neq("brand", "")
        .eq("is_archived", false)
        .order("brand");

      if (error && error.code === "42703") {
        // Column doesn't exist, try getting from brands table directly
        const { data: brandData, error: brandError } = await supabase
          .from("brands")
          .select("name")
          .eq("is_active", true)
          .order("name");

        if (brandError) {
          console.error("Error fetching brands:", brandError);
          return NextResponse.json(
            { error: "Failed to fetch brands" },
            { status: 500 }
          );
        }

        const uniqueBrands = (brandData || [])
          .map((brand) => brand.name)
          .sort();

        return NextResponse.json({
          success: true,
          brands: uniqueBrands,
        });
      }

      if (error) {
        console.error("Error fetching product brands:", error);
        return NextResponse.json(
          { error: "Failed to fetch brands" },
          { status: 500 }
        );
      }

      const uniqueBrands = Array.from(
        new Set(products?.map((item) => item.brand).filter(Boolean))
      ).sort();

      return NextResponse.json({
        success: true,
        brands: uniqueBrands,
      });
    }

    // Convert search params to proper types for validation
    const queryParams = {
      search: searchParams.get("search") || undefined,
      isActive: searchParams.get("isActive")
        ? searchParams.get("isActive") === "true"
        : undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 10,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : 0,
      sortBy: searchParams.get("sortBy") || "name",
      sortOrder: searchParams.get("sortOrder") || "asc",
    };

    // Validate query parameters
    const validatedQuery = brandQuerySchema.parse(queryParams);
    const {
      limit = 10,
      offset = 0,
      search,
      isActive,
      sortBy = "name",
      sortOrder = "asc",
    } = validatedQuery;

    const supabase = await createServerSupabaseClient();

    // Build query
    let query = supabase.from("brands").select("*", { count: "exact" });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (isActive !== undefined) {
      query = query.eq("is_active", isActive);
    }

    // Apply sorting and pagination
    const orderColumn =
      sortBy === "createdAt"
        ? "created_at"
        : sortBy === "updatedAt"
          ? "updated_at"
          : "name";
    query = query
      .order(orderColumn, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    const { data: brands, error, count } = await query;

    if (error) {
      console.error("Error fetching brands:", error);
      return NextResponse.json(
        { error: "Failed to fetch brands" },
        { status: 500 }
      );
    }

    const page = Math.floor(offset / limit) + 1;

    return NextResponse.json({
      success: true,
      data: brands,
      pagination: {
        page,
        limit,
        offset,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Brands API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/brands - Create a new brand
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createBrandSchema.parse(body);

    const supabase = await createServerSupabaseClient();

    // Check if brand name already exists
    const { data: existingBrand } = await supabase
      .from("brands")
      .select("id")
      .eq("name", validatedData.name)
      .single();

    if (existingBrand) {
      return NextResponse.json(
        { error: "Brand name already exists" },
        { status: 400 }
      );
    }

    // Transform form data (handle both isActive and is_active)
    const brandData = { ...validatedData };
    if ("isActive" in brandData) {
      brandData.is_active = (brandData as any).isActive;
      delete (brandData as any).isActive;
    }

    // Create the brand
    const { data: brand, error } = await supabase
      .from("brands")
      .insert([brandData])
      .select("*")
      .single();

    if (error) {
      console.error("Error creating brand:", error);
      return NextResponse.json(
        { error: "Failed to create brand" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      brand,
    });
  } catch (error) {
    console.error("Create brand API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
