import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canViewLowStock } from "@/lib/roles";
import { supabase } from "@/lib/supabase";

const lowStockQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 50)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 0)),
  category: z.string().optional(),
  brand: z.string().optional(),
  supplier: z.string().optional(),
  threshold: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has required permissions
    if (!canViewLowStock(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedQuery = lowStockQuerySchema.parse(queryParams);
    const { limit, offset, category, brand, supplier, threshold } =
      validatedQuery;

    // Build the base query
    let query = supabase
      .from("products")
      .select(
        `
        id,
        name,
        sku,
        stock,
        min_stock,
        cost,
        price,
        status,
        category:categories(id, name),
        brand:brands(id, name),
        supplier:suppliers(id, name),
        created_at,
        updated_at
      `
      )
      .eq("is_archived", false)
      .eq("status", "active");

    // Apply low stock filter - products where stock <= min_stock
    if (threshold !== undefined) {
      query = query.lte("stock", threshold);
    }
    // Note: We'll filter by stock <= min_stock after getting the data since Supabase doesn't support column-to-column comparison

    // Apply additional filters
    if (category) {
      query = query.eq("category_id", category);
    }
    if (brand) {
      query = query.eq("brand_id", brand);
    }
    if (supplier) {
      query = query.eq("supplier_id", supplier);
    }

    // Apply pagination and ordering
    query = query
      .order("stock", { ascending: true })
      .order("min_stock", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: allProducts, error, count } = await query;

    if (error) {
      console.error("Error fetching low stock products:", error);
      return NextResponse.json(
        { error: "Failed to fetch low stock products" },
        { status: 500 }
      );
    }

    // Filter products where stock <= min_stock (if no threshold is specified)
    let products = allProducts || [];
    if (threshold === undefined) {
      products = products.filter(
        (product) => product.stock <= product.min_stock
      );
    }

    // Calculate additional metrics
    const totalValue =
      products?.reduce((sum, product) => {
        return sum + parseFloat(product.cost.toString()) * product.stock;
      }, 0) || 0;

    const criticalStock = products?.filter((p) => p.stock === 0).length || 0;
    const lowStock =
      products?.filter((p) => p.stock > 0 && p.stock <= p.min_stock).length ||
      0;

    return NextResponse.json({
      products: products || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
      metrics: {
        totalValue,
        criticalStock,
        lowStock,
        totalProducts: products?.length || 0,
      },
    });
  } catch (error) {
    console.error("Error in low stock API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
