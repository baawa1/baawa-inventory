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
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build query with product and purchase order counts
    let query = supabase.from("suppliers").select(`
        id,
        name,
        contact_person,
        email,
        phone,
        address,
        is_active,
        created_at,
        updated_at,
        products:products(count),
        purchase_orders:purchase_orders(count)
      `);

    // Apply filters
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    if (isActive !== null && isActive !== undefined) {
      query = query.eq("is_active", isActive === "true");
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    const { data: suppliersData, error, count } = await query;

    if (error) {
      console.error("Error fetching suppliers:", error);
      return NextResponse.json(
        { error: "Failed to fetch suppliers" },
        { status: 500 }
      );
    }

    // Transform the data to match the component interface
    const suppliers =
      suppliersData?.map((supplier: any) => ({
        id: supplier.id,
        name: supplier.name,
        contactPerson: supplier.contact_person,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        isActive: supplier.is_active,
        createdAt: supplier.created_at,
        updatedAt: supplier.updated_at,
        _count: {
          products: supplier.products?.[0]?.count || 0,
          purchaseOrders: supplier.purchase_orders?.[0]?.count || 0,
        },
      })) || [];

    // Get total count for pagination (applying same filters)
    let countQuery = supabase
      .from("suppliers")
      .select("*", { count: "exact", head: true });

    // Apply same filters to count query
    if (search) {
      countQuery = countQuery.or(
        `name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    if (isActive !== null && isActive !== undefined) {
      countQuery = countQuery.eq("is_active", isActive === "true");
    }

    const { count: totalCount } = await countQuery;

    return NextResponse.json({
      suppliers,
      total: totalCount || 0,
      page,
      limit,
      totalPages: Math.ceil((totalCount || 0) / limit),
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

    // Transform frontend field names to database field names
    const {
      name,
      contactPerson,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      taxId,
      paymentTerms,
      creditLimit,
      isActive = true,
      notes,
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

    // Create the supplier with mapped field names
    const { data: supplier, error } = await supabase
      .from("suppliers")
      .insert({
        name,
        contact_person: contactPerson,
        email,
        phone,
        address,
        city,
        state,
        country,
        postal_code: postalCode,
        tax_number: taxId,
        payment_terms: paymentTerms,
        credit_limit: creditLimit,
        is_active: isActive,
        notes,
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
