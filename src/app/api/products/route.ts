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
      brand,
      status,
      supplierId,
      minPrice,
      maxPrice,
      lowStock,
      outOfStock,
      sortBy = "created_at",
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
        supplier:suppliers(id, name, contact_person)
      `
      )
      .eq("is_archived", false);

    // Apply filters
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`
      );
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (brand) {
      query = query.eq("brand", brand);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (supplierId) {
      query = query.eq("supplier_id", supplierId);
    }

    if (minPrice !== undefined) {
      query = query.gte("price", minPrice);
    }

    if (maxPrice !== undefined) {
      query = query.lte("price", maxPrice);
    }

    if (outOfStock) {
      query = query.eq("stock", 0);
    }

    // For low stock filter, we need to handle it differently
    // Since we can't compare columns directly, we'll get all products and filter
    if (lowStock) {
      // Don't apply pagination yet - we need to filter first
      const { data: allProducts, error: queryError } = await query;

      if (queryError) {
        console.error(
          "Error fetching products for low stock filter:",
          queryError
        );
        return NextResponse.json(
          { error: "Failed to fetch products" },
          { status: 500 }
        );
      }

      // Filter for low stock products
      const lowStockProducts = (allProducts || []).filter(
        (product: any) => product.stock <= product.min_stock
      );

      // Apply sorting
      const sortColumn =
        sortBy === "price"
          ? "price"
          : sortBy === "stock"
            ? "stock"
            : sortBy === "created_at"
              ? "created_at"
              : "created_at";

      lowStockProducts.sort((a: any, b: any) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        if (sortOrder === "asc") {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
      });

      // Apply pagination
      const startIndex = offset;
      const endIndex = offset + limit;
      const paginatedProducts = lowStockProducts.slice(startIndex, endIndex);

      return NextResponse.json({
        data: paginatedProducts,
        pagination: {
          page,
          limit,
          total: lowStockProducts.length,
          totalPages: Math.ceil(lowStockProducts.length / limit),
        },
      });
    }

    // Apply sorting and pagination for non-low-stock queries
    const sortColumn =
      sortBy === "price"
        ? "price"
        : sortBy === "stock"
          ? "stock"
          : sortBy === "created_at"
            ? "created_at"
            : sortBy;

    query = query
      .order(sortColumn, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    const { data: products, error } = await query;

    if (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_archived", false);

    // Apply the same filters to count query
    if (search) {
      countQuery = countQuery.or(
        `name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`
      );
    }
    if (category) {
      countQuery = countQuery.eq("category", category);
    }
    if (brand) {
      countQuery = countQuery.eq("brand", brand);
    }
    if (status) {
      countQuery = countQuery.eq("status", status);
    }
    if (supplierId) {
      countQuery = countQuery.eq("supplier_id", supplierId);
    }
    if (minPrice !== undefined) {
      countQuery = countQuery.gte("price", minPrice);
    }
    if (maxPrice !== undefined) {
      countQuery = countQuery.lte("price", maxPrice);
    }
    if (outOfStock) {
      countQuery = countQuery.eq("stock", 0);
    }

    const { count: totalCount } = await countQuery;

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
        cost: productData.purchasePrice,
        price: productData.sellingPrice,
        min_stock: productData.minimumStock,
        max_stock: productData.maximumStock,
        stock: productData.currentStock,
        supplier_id: productData.supplierId,
        status: productData.status,
        images: productData.imageUrl
          ? [{ url: productData.imageUrl, isPrimary: true }]
          : null,
        // notes field doesn't exist in the table - remove it for now
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
