import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Bypass auth for debugging - get data directly from Supabase
    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
      .limit(10);

    const { data: brandsData, error: brandsError } = await supabase
      .from("brands")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
      .limit(10);

    return NextResponse.json({
      categories: {
        data: categoriesData || [],
        error: categoriesError,
      },
      brands: {
        data: brandsData || [],
        error: brandsError,
      },
      message: "Debug data fetched successfully",
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  }
}
