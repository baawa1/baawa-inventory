import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/sales/[id] - Get a specific sales transaction
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = await params;

    // Validate ID
    const salesId = parseInt(id);
    if (isNaN(salesId)) {
      return NextResponse.json(
        { error: "Invalid sales transaction ID" },
        { status: 400 }
      );
    }

    const { data: salesTransaction, error } = await supabase
      .from("sales_transactions")
      .select(
        `
        *,
        user:users(id, name, email),
        salesItems:sales_items(
          id,
          quantity,
          unitPrice,
          subtotal,
          discount,
          product:products(
            id,
            name,
            sku,
            category,
            brand,
            unit
          )
        )
      `
      )
      .eq("id", salesId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Sales transaction not found" },
          { status: 404 }
        );
      }
      console.error("Error fetching sales transaction:", error);
      return NextResponse.json(
        { error: "Failed to fetch sales transaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: salesTransaction });
  } catch (error) {
    console.error("Error in GET /api/sales/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/sales/[id] - Update a sales transaction (limited fields)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    // Validate ID
    const salesId = parseInt(id);
    if (isNaN(salesId)) {
      return NextResponse.json(
        { error: "Invalid sales transaction ID" },
        { status: 400 }
      );
    }

    // Check if sales transaction exists
    const { data: existingTransaction } = await supabase
      .from("sales_transactions")
      .select("id, status")
      .eq("id", salesId)
      .single();

    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Sales transaction not found" },
        { status: 404 }
      );
    }

    // Only allow updating certain fields
    const allowedFields = [
      "status",
      "customerName",
      "customerEmail",
      "customerPhone",
      "notes",
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Validate status if provided
    if (updateData.status) {
      const validStatuses = ["PENDING", "PAID", "REFUNDED", "CANCELLED"];
      if (!validStatuses.includes(updateData.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update the sales transaction
    const { data: salesTransaction, error } = await supabase
      .from("sales_transactions")
      .update(updateData)
      .eq("id", salesId)
      .select(
        `
        *,
        user:users(id, name, email),
        salesItems:sales_items(
          id,
          quantity,
          unitPrice,
          subtotal,
          discount,
          product:products(id, name, sku)
        )
      `
      )
      .single();

    if (error) {
      console.error("Error updating sales transaction:", error);
      return NextResponse.json(
        { error: "Failed to update sales transaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: salesTransaction });
  } catch (error) {
    console.error("Error in PUT /api/sales/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/sales/[id] - Cancel a sales transaction and restore stock
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = await params;

    // Validate ID
    const salesId = parseInt(id);
    if (isNaN(salesId)) {
      return NextResponse.json(
        { error: "Invalid sales transaction ID" },
        { status: 400 }
      );
    }

    // Get the sales transaction with items
    const { data: salesTransaction, error: fetchError } = await supabase
      .from("sales_transactions")
      .select(
        `
        *,
        salesItems:sales_items(
          id,
          productId,
          quantity,
          product:products(id, name, stock)
        )
      `
      )
      .eq("id", salesId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Sales transaction not found" },
          { status: 404 }
        );
      }
      console.error("Error fetching sales transaction:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch sales transaction" },
        { status: 500 }
      );
    }

    // Check if transaction can be cancelled
    if (salesTransaction.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Sales transaction is already cancelled" },
        { status: 400 }
      );
    }

    if (salesTransaction.status === "REFUNDED") {
      return NextResponse.json(
        { error: "Cannot cancel a refunded transaction" },
        { status: 400 }
      );
    }

    // Restore stock for each item
    const stockRestores = [];
    for (const item of salesTransaction.salesItems) {
      const newStock = item.product.stock + item.quantity;

      const { error: stockError } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", item.productId);

      if (stockError) {
        console.error("Error restoring product stock:", stockError);
        return NextResponse.json(
          { error: `Failed to restore stock for product ${item.product.name}` },
          { status: 500 }
        );
      }

      stockRestores.push({
        productId: item.productId,
        productName: item.product.name,
        oldStock: item.product.stock,
        newStock,
        restoredQuantity: item.quantity,
      });
    }

    // Update transaction status to CANCELLED
    const { data: updatedTransaction, error: updateError } = await supabase
      .from("sales_transactions")
      .update({ status: "CANCELLED" })
      .eq("id", salesId)
      .select(
        `
        *,
        user:users(id, name, email),
        salesItems:sales_items(
          id,
          quantity,
          unitPrice,
          subtotal,
          discount,
          product:products(id, name, sku)
        )
      `
      )
      .single();

    if (updateError) {
      console.error("Error cancelling sales transaction:", updateError);
      return NextResponse.json(
        { error: "Failed to cancel sales transaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: updatedTransaction,
      stockRestores,
      message: "Sales transaction cancelled and stock restored successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/sales/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
