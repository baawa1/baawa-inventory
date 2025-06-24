import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// GET /api/brands - Get unique brand values for filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get unique brands from products table
    const { data: brands, error } = await supabase
      .from("products")
      .select("brand")
      .not("brand", "is", null)
      .neq("brand", "")
      .eq("is_archived", false)
      .order("brand");

    if (error) {
      console.error("Error fetching brands:", error);
      return NextResponse.json(
        { error: "Failed to fetch brands" },
        { status: 500 }
      );
    }

    // Extract unique brand values
    const uniqueBrands = Array.from(
      new Set(brands?.map((item) => item.brand).filter(Boolean))
    ).sort();

    return NextResponse.json({
      success: true,
      brands: uniqueBrands,
    });
  } catch (error) {
    console.error("Brands API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
