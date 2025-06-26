import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  createCategorySchema,
  categoryQuerySchema,
} from "@/lib/validations/category";

// GET /api/categories - List categories with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to view categories
    if (!["ADMIN", "MANAGER", "STAFF"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Check if this is a legacy request for product categories (dropdown)
    const legacy = searchParams.get("legacy") === "true";

    if (legacy) {
      // Legacy functionality: Get unique categories from products for dropdowns
      // First check if products table has category column or category_id
      let { data: products, error } = await supabase
        .from("products")
        .select("category")
        .not("category", "is", null)
        .neq("category", "")
        .eq("is_archived", false)
        .order("category");

      if (error && error.code === "42703") {
        // Column doesn't exist, try with category_id and join with categories
        const { data: categoryData, error: categoryError } = await supabase
          .from("categories")
          .select("name")
          .eq("is_active", true)
          .order("name");

        if (categoryError) {
          console.error("Error fetching categories:", categoryError);
          return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
          );
        }

        const uniqueCategories = (categoryData || [])
          .map((cat) => cat.name)
          .sort();

        return NextResponse.json({
          success: true,
          categories: uniqueCategories,
        });
      }

      if (error) {
        console.error("Error fetching product categories:", error);
        return NextResponse.json(
          { error: "Failed to fetch categories" },
          { status: 500 }
        );
      }

      const uniqueCategories = Array.from(
        new Set(products?.map((item) => item.category).filter(Boolean))
      ).sort();

      return NextResponse.json({
        success: true,
        categories: uniqueCategories,
      });
    }

    // New functionality: Full category management
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

    const validatedQuery = categoryQuerySchema.parse(queryParams);

    // Build the query
    let query = supabase.from("categories").select("*", { count: "exact" });

    // Apply filters
    if (validatedQuery.search) {
      query = query.ilike("name", `%${validatedQuery.search}%`);
    }

    if (validatedQuery.isActive !== undefined) {
      query = query.eq("is_active", validatedQuery.isActive);
    }

    // Apply sorting
    const sortColumn =
      validatedQuery.sortBy === "createdAt"
        ? "created_at"
        : validatedQuery.sortBy === "updatedAt"
          ? "updated_at"
          : "name";

    query = query.order(sortColumn, {
      ascending: validatedQuery.sortOrder === "asc",
    });

    // Apply pagination
    query = query.range(
      validatedQuery.offset,
      validatedQuery.offset + validatedQuery.limit - 1
    );

    const { data: categories, error, count } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch categories" },
        { status: 500 }
      );
    }

    // Transform to camelCase for frontend
    const transformedCategories =
      categories?.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        isActive: category.is_active,
        createdAt: category.created_at,
        updatedAt: category.updated_at,
      })) || [];

    return NextResponse.json({
      success: true,
      data: transformedCategories,
      pagination: {
        total: count || 0,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to create categories
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createCategorySchema.parse(body);

    // Check if category name already exists
    const { data: existingCategory } = await supabase
      .from("categories")
      .select("id")
      .eq("name", validatedData.name)
      .single();

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 400 }
      );
    }

    // Create the category with snake_case field names
    const { data: category, error } = await supabase
      .from("categories")
      .insert({
        name: validatedData.name,
        description: validatedData.description,
        is_active: validatedData.isActive,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to create category" },
        { status: 500 }
      );
    }

    // Transform response to camelCase
    const transformedCategory = {
      id: category.id,
      name: category.name,
      description: category.description,
      isActive: category.is_active,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    };

    return NextResponse.json(transformedCategory, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
