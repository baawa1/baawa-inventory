import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  createSupplierSchema,
  supplierQuerySchema,
  validateRequest,
} from "@/lib/validations";

// GET /api/suppliers - List suppliers with optional filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase.from("suppliers").select(`
        *,
        products:products(count),
        purchaseOrders:purchase_orders(count)
      `);

    // Apply filters
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,contactName.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    if (isActive !== null && isActive !== undefined) {
      query = query.eq("isActive", isActive === "true");
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    const { data: suppliers, error, count } = await query;

    if (error) {
      console.error("Error fetching suppliers:", error);
      return NextResponse.json(
        { error: "Failed to fetch suppliers" },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from("suppliers")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      data: suppliers,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/suppliers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/suppliers - Create a new supplier
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    // Validate required fields
    const {
      name,
      contactName,
      email,
      phone,
      address,
      notes,
      isActive = true,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    // Check if supplier with same name already exists
    const { data: existingSupplier } = await supabase
      .from("suppliers")
      .select("id")
      .eq("name", name)
      .single();

    if (existingSupplier) {
      return NextResponse.json(
        { error: "Supplier with this name already exists" },
        { status: 409 }
      );
    }

    // Create the supplier
    const { data: supplier, error } = await supabase
      .from("suppliers")
      .insert({
        name,
        contactName,
        email,
        phone,
        address,
        notes,
        isActive,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error creating supplier:", error);
      return NextResponse.json(
        { error: "Failed to create supplier" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: supplier }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/suppliers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
