import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  createStockAdjustmentSchema,
  stockAdjustmentQuerySchema,
  validateRequest,
} from "@/lib/validations";

// GET /api/stock-adjustments - List stock adjustments with optional filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const productId = searchParams.get("productId");
    const userId = searchParams.get("userId");
    const type = searchParams.get("type");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase.from("stock_adjustments").select(`
        *,
        product:products(id, name, sku, category),
        user:users(id, first_name, last_name, email),
        approver:users!approved_by(id, first_name, last_name, email)
      `);

    // Apply filters
    if (productId) {
      query = query.eq("product_id", parseInt(productId));
    }

    if (userId) {
      query = query.eq("user_id", parseInt(userId));
    }

    if (type) {
      query = query.eq("adjustment_type", type);
    }

    if (fromDate) {
      query = query.gte("created_at", fromDate);
    }

    if (toDate) {
      query = query.lte("created_at", toDate);
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy === "createdAt" ? "created_at" : sortBy, {
        ascending: sortOrder === "asc",
      })
      .range(offset, offset + limit - 1);

    const { data: stockAdjustments, error, count } = await query;

    if (error) {
      console.error("Error fetching stock adjustments:", error);
      return NextResponse.json(
        { error: "Failed to fetch stock adjustments" },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from("stock_adjustments")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      data: stockAdjustments,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/stock-adjustments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/stock-adjustments - Create a new stock adjustment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    // Validate required fields
    const { productId, userId, type, quantity, reason, notes } = body;

    if (!productId || !userId || !type || quantity === undefined || !reason) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: productId, userId, type, quantity, reason",
        },
        { status: 400 }
      );
    }

    // Validate adjustment type
    const validTypes = [
      "INCREASE",
      "DECREASE",
      "RECOUNT",
      "DAMAGE",
      "TRANSFER",
      "RETURN",
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid adjustment type" },
        { status: 400 }
      );
    }

    // Validate quantity
    const adjustmentQuantity = parseInt(quantity);
    if (isNaN(adjustmentQuantity) || adjustmentQuantity <= 0) {
      return NextResponse.json(
        { error: "Quantity must be a positive number" },
        { status: 400 }
      );
    }

    // Validate user exists
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current product stock
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, stock")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Calculate new stock based on adjustment type
    let newStock = product.stock;
    let actualQuantity = adjustmentQuantity;

    switch (type) {
      case "INCREASE":
      case "RETURN":
        newStock = product.stock + adjustmentQuantity;
        break;
      case "DECREASE":
      case "DAMAGE":
      case "TRANSFER":
        if (product.stock < adjustmentQuantity) {
          return NextResponse.json(
            {
              error: `Insufficient stock. Current stock: ${product.stock}, Requested adjustment: ${adjustmentQuantity}`,
            },
            { status: 400 }
          );
        }
        newStock = product.stock - adjustmentQuantity;
        actualQuantity = -adjustmentQuantity; // Store as negative for decrease operations
        break;
      case "RECOUNT":
        // For recount, the quantity represents the new total stock
        actualQuantity = adjustmentQuantity - product.stock;
        newStock = adjustmentQuantity;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid adjustment type" },
          { status: 400 }
        );
    }

    // Ensure stock doesn't go negative
    if (newStock < 0) {
      return NextResponse.json(
        { error: "Stock adjustment would result in negative stock" },
        { status: 400 }
      );
    }

    // Create the stock adjustment record (PENDING by default)
    const { data: stockAdjustment, error: adjustmentError } = await supabase
      .from("stock_adjustments")
      .insert({
        product_id: productId,
        user_id: userId,
        adjustment_type: type,
        quantity: actualQuantity,
        old_quantity: product.stock,
        new_quantity: newStock,
        reason,
        notes,
        reference_number: body.referenceNumber || null,
        status: "PENDING", // All adjustments start as pending
      })
      .select(
        `
        *,
        product:products(id, name, sku, category),
        user:users(id, first_name, last_name, email)
      `
      )
      .single();

    if (adjustmentError) {
      console.error("Error creating stock adjustment:", adjustmentError);
      return NextResponse.json(
        { error: "Failed to create stock adjustment" },
        { status: 500 }
      );
    }

    // NOTE: Stock is NOT updated here - it will be updated when approved

    return NextResponse.json(
      {
        data: stockAdjustment,
        message: "Stock adjustment created and pending approval",
        stockChange: {
          productId,
          productName: product.name,
          currentStock: product.stock,
          proposedNewStock: newStock,
          adjustmentQuantity: actualQuantity,
          status: "PENDING",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/stock-adjustments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
