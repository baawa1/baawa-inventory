import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  createProductSchema,
  productQuerySchema,
  validateRequest,
} from "@/lib/validations";

// GET /api/products - List products with optional filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);

    // Convert search params to object for validation
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validation = validateRequest(productQuerySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.errors },
        { status: 400 }
      );
    }

    const validatedData = validation.data!;
    const {
      page = 1,
      limit = 10,
      search,
      category,
      status,
      supplierId,
      minPrice,
      maxPrice,
      lowStock,
      outOfStock,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = validatedData;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("products")
      .select(
        `
        *,
        supplier:suppliers(id, name)
      `
      )
      .eq("isArchived", false);

    // Apply filters
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`
      );
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (supplierId) {
      query = query.eq("supplierId", supplierId);
    }

    if (minPrice !== undefined) {
      query = query.gte("sellingPrice", minPrice);
    }

    if (maxPrice !== undefined) {
      query = query.lte("sellingPrice", maxPrice);
    }

    if (lowStock) {
      query = query.filter("currentStock", "lte", "minimumStock");
    }

    if (outOfStock) {
      query = query.eq("currentStock", 0);
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    const { data: products, error, count } = await query;

    if (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("isArchived", false);

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    // Validate request body
    const validation = validateRequest(createProductSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid product data", details: validation.errors },
        { status: 400 }
      );
    }

    const productData = validation.data!;

    // Check if SKU already exists
    const { data: existingProduct } = await supabase
      .from("products")
      .select("id")
      .eq("sku", productData.sku)
      .single();

    if (existingProduct) {
      return NextResponse.json(
        { error: "Product with this SKU already exists" },
        { status: 409 }
      );
    }

    // Create the product
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        name: productData.name,
        sku: productData.sku,
        barcode: productData.barcode,
        description: productData.description,
        category: productData.category,
        brand: productData.brand,
        purchasePrice: productData.purchasePrice,
        sellingPrice: productData.sellingPrice,
        minimumStock: productData.minimumStock,
        maximumStock: productData.maximumStock,
        currentStock: productData.currentStock,
        supplierId: productData.supplierId,
        status: productData.status,
        imageUrl: productData.imageUrl,
        notes: productData.notes,
      })
      .select(
        `
        *,
        supplier:suppliers(id, name)
      `
      )
      .single();

    if (error) {
      console.error("Error creating product:", error);
      return NextResponse.json(
        { error: "Failed to create product" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
