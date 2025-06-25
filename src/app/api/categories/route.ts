import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// GET /api/categories - Get unique category values for filtering
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Get unique categories from products table
    const { data: categories, error } = await supabase
      .from("products")
      .select("category")
      .not("category", "is", null)
      .neq("category", "")
      .eq("is_archived", false)
      .order("category");

    if (error) {
      console.error("Error fetching categories:", error);
      return NextResponse.json(
        { error: "Failed to fetch categories" },
        { status: 500 }
      );
    }

    // Extract unique category values
    const uniqueCategories = Array.from(
      new Set(categories?.map((item) => item.category).filter(Boolean))
    ).sort();

    return NextResponse.json({
      success: true,
      categories: uniqueCategories,
    });
  } catch (error) {
    console.error("Error in GET /api/categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
