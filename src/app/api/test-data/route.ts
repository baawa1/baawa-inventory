import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Test categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    if (categoriesError) {
      console.error("Categories error:", categoriesError);
      return NextResponse.json(
        { error: "Failed to fetch categories", details: categoriesError },
        { status: 500 }
      );
    }

    // Test brands
    const { data: brandsData, error: brandsError } = await supabase
      .from("brands")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    if (brandsError) {
      console.error("Brands error:", brandsError);
      return NextResponse.json(
        { error: "Failed to fetch brands", details: brandsError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      categories: { data: categoriesData || [] },
      brands: { data: brandsData || [] },
      message: "Test data fetched successfully",
    });
  } catch (error) {
    console.error("Test data error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  }
}
