import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ZodError } from "zod";
import {
  createStockAdditionSchema,
  stockAdditionQuerySchema,
  type CreateStockAdditionData,
  type StockAdditionQuery,
} from "@/lib/validations/stock-management";

// GET /api/stock-additions - List stock additions with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const queryParams: Record<string, unknown> = {};

    // Parse query parameters
    for (const [key, value] of searchParams) {
      if (
        key === "productId" ||
        key === "supplierId" ||
        key === "createdBy" ||
        key === "page" ||
        key === "limit"
      ) {
        queryParams[key] = parseInt(value);
      } else {
        queryParams[key] = value;
      }
    }

    const validatedQuery = stockAdditionQuerySchema.parse(queryParams);

    // Build Supabase query
    let query = supabase.from("stock_additions").select(`
        id,
        quantity,
        cost_per_unit,
        total_cost,
        purchase_date,
        notes,
        reference_no,
        created_at,
        products:product_id (id, name, sku, stock),
        suppliers:supplier_id (id, name),
        users:created_by (id, first_name, last_name, email)
      `);

    // Apply filters
    if (validatedQuery.productId) {
      query = query.eq("product_id", validatedQuery.productId);
    }
    if (validatedQuery.supplierId) {
      query = query.eq("supplier_id", validatedQuery.supplierId);
    }
    if (validatedQuery.createdBy) {
      query = query.eq("created_by", validatedQuery.createdBy);
    }
    if (validatedQuery.startDate) {
      query = query.gte("purchase_date", validatedQuery.startDate);
    }
    if (validatedQuery.endDate) {
      query = query.lte("purchase_date", validatedQuery.endDate);
    }

    // Apply sorting and pagination
    const sortColumn =
      validatedQuery.sortBy === "createdAt"
        ? "created_at"
        : validatedQuery.sortBy;
    query = query
      .order(sortColumn, { ascending: validatedQuery.sortOrder === "asc" })
      .range(
        (validatedQuery.page - 1) * validatedQuery.limit,
        validatedQuery.page * validatedQuery.limit - 1
      );

    const { data: stockAdditions, error, count } = await query;

    if (error) {
      console.error("Error fetching stock additions:", error);
      return NextResponse.json(
        { error: "Failed to fetch stock additions" },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / validatedQuery.limit);

    return NextResponse.json({
      stockAdditions: stockAdditions || [],
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: count || 0,
        totalPages,
        hasNext: validatedQuery.page < totalPages,
        hasPrev: validatedQuery.page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching stock additions:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock additions" },
      { status: 500 }
    );
  }
}

// POST /api/stock-additions - Create new stock addition
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user has proper role
  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();
    console.log("Received body:", body); // Debug log

    const validatedData: CreateStockAdditionData =
      createStockAdditionSchema.parse(body);
    console.log("Validated data:", validatedData); // Debug log

    // Check if product exists
    console.log("Checking if product exists for ID:", validatedData.productId);
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, stock, cost")
      .eq("id", validatedData.productId)
      .single();

    console.log("Found product:", product);

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if supplier exists (if provided)
    if (validatedData.supplierId) {
      const { data: supplier, error: supplierError } = await supabase
        .from("suppliers")
        .select("id, is_active")
        .eq("id", validatedData.supplierId)
        .single();

      if (supplierError || !supplier) {
        return NextResponse.json(
          { error: "Supplier not found" },
          { status: 404 }
        );
      }

      if (!supplier.is_active) {
        return NextResponse.json(
          { error: "Supplier is inactive" },
          { status: 400 }
        );
      }
    }

    // Calculate total cost
    const totalCost = validatedData.quantity * validatedData.costPerUnit;

    // Create stock addition record
    const { data: stockAddition, error: additionError } = await supabase
      .from("stock_additions")
      .insert({
        product_id: validatedData.productId,
        supplier_id: validatedData.supplierId,
        created_by: parseInt(session.user.id),
        quantity: validatedData.quantity,
        cost_per_unit: validatedData.costPerUnit,
        total_cost: totalCost,
        purchase_date:
          validatedData.purchaseDate || new Date().toISOString().split("T")[0],
        notes: validatedData.notes,
        reference_no: validatedData.referenceNo,
      })
      .select(
        `
        id,
        quantity,
        cost_per_unit,
        total_cost,
        purchase_date,
        notes,
        reference_no,
        created_at,
        products:product_id (id, name, sku, stock, cost),
        suppliers:supplier_id (id, name),
        users:created_by (id, first_name, last_name, email)
      `
      )
      .single();

    if (additionError) {
      console.error("Error creating stock addition:", additionError);
      return NextResponse.json(
        { error: "Failed to create stock addition" },
        { status: 500 }
      );
    }

    // Calculate weighted average cost
    const currentValue = product.stock * product.cost;
    const additionValue = validatedData.quantity * validatedData.costPerUnit;
    const newStock = product.stock + validatedData.quantity;
    const newAverageCost =
      newStock > 0
        ? (currentValue + additionValue) / newStock
        : validatedData.costPerUnit;

    // Update product stock and cost
    const { error: updateError } = await supabase
      .from("products")
      .update({
        stock: newStock,
        cost: newAverageCost,
      })
      .eq("id", validatedData.productId);

    if (updateError) {
      console.error("Error updating product:", updateError);
      return NextResponse.json(
        { error: "Failed to update product stock" },
        { status: 500 }
      );
    }

    // Create audit log
    const { error: auditError } = await supabase.from("audit_logs").insert({
      action: "STOCK_ADDITION",
      entity_type: "PRODUCT",
      entity_id: validatedData.productId.toString(),
      user_id: parseInt(session.user.id),
      new_values: {
        productName: product.name,
        quantityAdded: validatedData.quantity,
        costPerUnit: validatedData.costPerUnit,
        previousStock: product.stock,
        newStock: newStock,
        previousCost: product.cost,
        newAverageCost: newAverageCost,
        totalCost,
        referenceNo: validatedData.referenceNo,
      },
    });

    if (auditError) {
      console.error("Error creating audit log:", auditError);
      // Don't fail the request for audit log errors
    }

    return NextResponse.json(
      {
        stockAddition,
        message: `Successfully added ${validatedData.quantity} units to ${product.name}. New stock: ${newStock}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating stock addition:", error);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      console.error("Validation errors:", error.errors);
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: error.errors
            .map((err: any) => `${err.path.join(".")}: ${err.message}`)
            .join(", "),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create stock addition" },
      { status: 500 }
    );
  }
}
