import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { validateRequest } from "@/lib/validations/common";
import { z } from "zod";

// Query schema for archived products
const archivedProductsQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(["name", "archived_at", "created_at"]).default("archived_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// GET /api/products/archived - Get archived products
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryData = {
      search: searchParams.get("search") || undefined,
      category: searchParams.get("category") || undefined,
      brand: searchParams.get("brand") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
      sortBy: searchParams.get("sortBy") || "archived_at",
      sortOrder: searchParams.get("sortOrder") || "desc",
    };

    const validation = validateRequest(archivedProductsQuerySchema, queryData);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.errors },
        { status: 400 }
      );
    }

    const validatedData = validation.data;
    if (!validatedData) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const {
      search,
      category,
      brand,
      page = 1,
      limit = 10,
      sortBy = "archived_at",
      sortOrder = "desc",
    } = validatedData;
    const offset = (page - 1) * limit;

    // Build query for archived products
    let query = supabase
      .from("products")
      .select(
        `
        id,
        name,
        sku,
        status,
        stock,
        price,
        cost,
        is_archived,
        archived_at,
        created_at,
        updated_at,
        category:categories(id, name),
        brand:brands(id, name),
        supplier:suppliers(id, name)
      `
      )
      .eq("is_archived", true);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq("category_id", parseInt(category));
    }

    if (brand) {
      query = query.eq("brand_id", parseInt(brand));
    }

    // Get total count for pagination
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_archived", true);

    // Apply sorting and pagination
    query = query
      .order(sortBy as any, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    const { data: products, error } = await query;

    if (error) {
      console.error("Error fetching archived products:", error);
      return NextResponse.json(
        { error: "Failed to fetch archived products" },
        { status: 500 }
      );
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/products/archived:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
