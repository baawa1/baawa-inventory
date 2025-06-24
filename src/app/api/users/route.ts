import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import {
  createUserSchema,
  userQuerySchema,
  validateRequest,
} from "@/lib/validations";
import { withPermission, AuthenticatedRequest } from "@/lib/api-middleware";

// GET /api/users - List users with optional filtering and pagination
// Requires permission to manage users (ADMIN only)
export const GET = withPermission("canManageUsers")(async function (
  request: AuthenticatedRequest
) {
  try {
    const supabase = await createServerSupabaseClient();

    const { searchParams } = new URL(request.url);

    // Convert search params to object for validation
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validation = userQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.error.issues },
        { status: 400 }
      );
    }

    const validatedData = validation.data;
    const {
      page = 1,
      limit = 10,
      search,
      role,
      status,
      isActive,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = validatedData;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build query - exclude password from response
    let query = supabase
      .from("users")
      .select(
        "id, first_name, last_name, email, role, is_active, user_status, email_verified, created_at, last_login, approved_by, approved_at, rejection_reason"
      );

    // Apply filters
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    if (role) {
      query = query.eq("role", role);
    }

    if (status) {
      query = query.eq("user_status", status);
    }

    if (isActive !== undefined) {
      query = query.eq("is_active", isActive);
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy === "createdAt" ? "created_at" : sortBy, {
        ascending: sortOrder === "asc",
      })
      .range(offset, offset + limit - 1);

    const { data: users, error } = await query;

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json(
        { error: "Failed to fetch users", details: error.message },
        { status: 500 }
      );
    }

    // Transform the response to use camelCase for frontend compatibility
    const transformedUsers =
      users?.map((user) => ({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        isActive: user.is_active,
        userStatus: user.user_status,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        approvedBy: user.approved_by,
        approvedAt: user.approved_at,
        rejectionReason: user.rejection_reason,
      })) || [];

    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error("Error in GET /api/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

// POST /api/users - Create a new user
// Requires permission to manage users (ADMIN only)
export const POST = withPermission("canManageUsers")(async function (
  request: AuthenticatedRequest
) {
  try {
    const supabase = await createServerSupabaseClient();
    const body = await request.json();

    // Validate request body
    const validation = createUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid user data", details: validation.error.issues },
        { status: 400 }
      );
    }

    const userData = validation.data;

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", userData.email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create the user
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        password_hash: hashedPassword,
        phone: userData.phone,
        role: userData.role,
        is_active: userData.isActive ?? true, // Default to true if not specified
        user_status: "APPROVED", // New users created by admin are auto-approved
        email_verified: true, // Admin-created users are auto-verified
        email_verified_at: new Date().toISOString(), // Set verification timestamp
      })
      .select(
        "id, first_name, last_name, email, role, is_active, created_at, last_login"
      )
      .single();

    if (error) {
      console.error("Error creating user:", error);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Transform response to camelCase
    const transformedUser = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      lastLogin: user.last_login,
    };

    return NextResponse.json(transformedUser, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
