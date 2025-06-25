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
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validatedQuery = brandQuerySchema.parse(queryParams);
    const {
      limit = 10,
      offset = 0,
      search = "",
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
      brands,
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

    // Create the brand
    const { data: brand, error } = await supabase
      .from("brands")
      .insert([validatedData])
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
