import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  createSaleSchema,
  saleQuerySchema,
  validateRequest,
} from "@/lib/validations";

// GET /api/sales - List sales transactions with optional filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const paymentMethod = searchParams.get("paymentMethod");
    const userId = searchParams.get("userId");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase.from("sales_transactions").select(`
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
      `);

    // Apply filters
    if (search) {
      query = query.or(
        `transactionNumber.ilike.%${search}%,customerName.ilike.%${search}%,notes.ilike.%${search}%`
      );
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (paymentMethod) {
      query = query.eq("paymentMethod", paymentMethod);
    }

    if (userId) {
      query = query.eq("userId", parseInt(userId));
    }

    if (fromDate) {
      query = query.gte("createdAt", fromDate);
    }

    if (toDate) {
      query = query.lte("createdAt", toDate);
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    const { data: salesTransactions, error, count } = await query;

    if (error) {
      console.error("Error fetching sales transactions:", error);
      return NextResponse.json(
        { error: "Failed to fetch sales transactions" },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from("sales_transactions")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      data: salesTransactions,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/sales:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/sales - Create a new sales transaction
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    // Validate required fields
    const {
      userId,
      items,
      paymentMethod,
      subtotal,
      tax = 0,
      discount = 0,
      total,
      customerName,
      customerEmail,
      customerPhone,
      notes,
      status = "PAID",
    } = body;

    if (
      !userId ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !paymentMethod ||
      total === undefined
    ) {
      return NextResponse.json(
        {
          error: "Missing required fields: userId, items, paymentMethod, total",
        },
        { status: 400 }
      );
    }

    // Validate payment method
    const validPaymentMethods = [
      "CASH",
      "BANK_TRANSFER",
      "POS_MACHINE",
      "CREDIT_CARD",
      "MOBILE_MONEY",
    ];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["PENDING", "PAID", "REFUNDED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
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

    // Generate transaction number
    const timestamp = Date.now();
    const transactionNumber = `TXN-${timestamp}`;

    // Start transaction
    const { data: salesTransaction, error: transactionError } = await supabase
      .from("sales_transactions")
      .insert({
        transactionNumber,
        userId,
        subtotal: parseFloat(subtotal),
        tax: parseFloat(tax),
        discount: parseFloat(discount),
        total: parseFloat(total),
        paymentMethod,
        status,
        customerName,
        customerEmail,
        customerPhone,
        notes,
      })
      .select("*")
      .single();

    if (transactionError) {
      console.error("Error creating sales transaction:", transactionError);
      return NextResponse.json(
        { error: "Failed to create sales transaction" },
        { status: 500 }
      );
    }

    // Create sales items and update stock
    const salesItems = [];
    const stockUpdates = [];

    for (const item of items) {
      const {
        productId,
        quantity,
        unitPrice,
        discount: itemDiscount = 0,
      } = item;

      if (!productId || !quantity || !unitPrice) {
        return NextResponse.json(
          { error: "Each item must have productId, quantity, and unitPrice" },
          { status: 400 }
        );
      }

      // Verify product exists and has sufficient stock
      const { data: product } = await supabase
        .from("products")
        .select("id, name, stock, price")
        .eq("id", productId)
        .single();

      if (!product) {
        return NextResponse.json(
          { error: `Product with ID ${productId} not found` },
          { status: 404 }
        );
      }

      if (product.stock < quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for product ${product.name}. Available: ${product.stock}, Required: ${quantity}`,
          },
          { status: 400 }
        );
      }

      // Calculate subtotal for this item
      const itemSubtotal =
        quantity * parseFloat(unitPrice) - parseFloat(itemDiscount);

      // Create sales item
      const { data: salesItem, error: itemError } = await supabase
        .from("sales_items")
        .insert({
          salesTransactionId: salesTransaction.id,
          productId,
          quantity: parseInt(quantity),
          unitPrice: parseFloat(unitPrice),
          subtotal: itemSubtotal,
          discount: parseFloat(itemDiscount),
        })
        .select("*")
        .single();

      if (itemError) {
        console.error("Error creating sales item:", itemError);
        return NextResponse.json(
          { error: "Failed to create sales item" },
          { status: 500 }
        );
      }

      salesItems.push(salesItem);

      // Update product stock
      const newStock = product.stock - quantity;
      const { error: stockError } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", productId);

      if (stockError) {
        console.error("Error updating product stock:", stockError);
        return NextResponse.json(
          { error: "Failed to update product stock" },
          { status: 500 }
        );
      }

      stockUpdates.push({
        productId,
        oldStock: product.stock,
        newStock,
        quantity,
      });
    }

    // Fetch the complete transaction with relations
    const { data: completeSalesTransaction } = await supabase
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
          product:products(id, name, sku)
        )
      `
      )
      .eq("id", salesTransaction.id)
      .single();

    return NextResponse.json(
      {
        data: completeSalesTransaction,
        stockUpdates,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/sales:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
