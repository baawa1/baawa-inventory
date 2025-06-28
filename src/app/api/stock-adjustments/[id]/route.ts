import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PUT /api/stock-adjustments/[id] - Update a stock adjustment (only if PENDING)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const adjustmentId = parseInt(params.id);
    const body = await request.json();

    if (isNaN(adjustmentId)) {
      return NextResponse.json(
        { error: "Invalid adjustment ID" },
        { status: 400 }
      );
    }

    // Validate required fields
    const { productId, type, quantity, reason, notes, referenceNumber } = body;

    if (!productId || !type || quantity === undefined || !reason) {
      return NextResponse.json(
        {
          error: "Missing required fields: productId, type, quantity, reason",
        },
        { status: 400 }
      );
    }

    // Get the existing stock adjustment
    const { data: existingAdjustment, error: fetchError } = await supabase
      .from("stock_adjustments")
      .select("*")
      .eq("id", adjustmentId)
      .single();

    if (fetchError || !existingAdjustment) {
      return NextResponse.json(
        { error: "Stock adjustment not found" },
        { status: 404 }
      );
    }

    // Check if the adjustment can be edited
    if (existingAdjustment.status !== "PENDING") {
      return NextResponse.json(
        {
          error:
            "Cannot edit stock adjustment that has been approved or rejected",
        },
        { status: 400 }
      );
    }

    // Check if user owns the adjustment or is an admin
    if (
      existingAdjustment.user_id !== parseInt(session.user.id) &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "You can only edit your own stock adjustments" },
        { status: 403 }
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

    // Update the stock adjustment record
    const { data: stockAdjustment, error: adjustmentError } = await supabase
      .from("stock_adjustments")
      .update({
        product_id: productId,
        adjustment_type: type,
        quantity: actualQuantity,
        old_quantity: product.stock,
        new_quantity: newStock,
        reason,
        notes,
        reference_number: referenceNumber || null,
      })
      .eq("id", adjustmentId)
      .select(
        `
        *,
        product:products(id, name, sku, category),
        user:users(id, first_name, last_name, email)
      `
      )
      .single();

    if (adjustmentError) {
      console.error("Error updating stock adjustment:", adjustmentError);
      return NextResponse.json(
        { error: "Failed to update stock adjustment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: stockAdjustment,
      message: "Stock adjustment updated successfully",
      stockChange: {
        productId,
        productName: product.name,
        currentStock: product.stock,
        proposedNewStock: newStock,
        adjustmentQuantity: actualQuantity,
        status: "PENDING",
      },
    });
  } catch (error) {
    console.error("Error in PUT /api/stock-adjustments/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/stock-adjustments/[id] - Get a single stock adjustment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const adjustmentId = parseInt(params.id);

    if (isNaN(adjustmentId)) {
      return NextResponse.json(
        { error: "Invalid adjustment ID" },
        { status: 400 }
      );
    }

    const { data: stockAdjustment, error } = await supabase
      .from("stock_adjustments")
      .select(
        `
        *,
        product:products(id, name, sku, category),
        user:users(id, first_name, last_name, email),
        approver:users!approved_by(id, first_name, last_name, email)
      `
      )
      .eq("id", adjustmentId)
      .single();

    if (error || !stockAdjustment) {
      return NextResponse.json(
        { error: "Stock adjustment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: stockAdjustment });
  } catch (error) {
    console.error("Error in GET /api/stock-adjustments/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
