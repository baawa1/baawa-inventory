import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  userIdSchema,
  updateUserSchema,
  validateRequest,
} from "@/lib/validations";

interface RouteParams {
  params: { id: string };
}

// GET /api/users/[id] - Get a specific user
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = params;

    // Validate ID
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select(
        `
        *,
        salesTransactions:sales_transactions(
          id,
          total,
          paymentMethod,
          status,
          createdAt
        ),
        stockAdjustments:stock_adjustments(
          id,
          type,
          quantity,
          reason,
          createdAt,
          product:products(id, name, sku)
        )
      `
      )
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      console.error("Error fetching user:", error);
      return NextResponse.json(
        { error: "Failed to fetch user" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("Error in GET /api/users/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update a user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = params;
    const body = await request.json();

    // Validate ID
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, email")
      .eq("id", userId)
      .single();

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If email is being updated, check for conflicts
    if (body.email && body.email !== existingUser.email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }

      const { data: conflictUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", body.email)
        .neq("id", userId)
        .single();

      if (conflictUser) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 }
        );
      }
    }

    // Validate role if provided
    if (body.role) {
      const validRoles = ["ADMIN", "MANAGER", "STAFF"];
      if (!validRoles.includes(body.role)) {
        return NextResponse.json(
          { error: "Invalid role. Must be one of: ADMIN, MANAGER, STAFF" },
          { status: 400 }
        );
      }
    }

    // Update the user
    const { data: user, error } = await supabase
      .from("users")
      .update(body)
      .eq("id", userId)
      .select("*")
      .single();

    if (error) {
      console.error("Error updating user:", error);
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("Error in PUT /api/users/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Deactivate a user (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get("hard") === "true";

    // Validate ID
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", userId)
      .single();

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (hardDelete) {
      // Check for related records that would prevent deletion
      const { data: salesTransactions } = await supabase
        .from("sales_transactions")
        .select("id")
        .eq("userId", userId)
        .limit(1);

      if (salesTransactions && salesTransactions.length > 0) {
        return NextResponse.json(
          {
            error:
              "Cannot delete user with existing sales records. Use deactivation instead.",
          },
          { status: 409 }
        );
      }

      // Hard delete
      const { error } = await supabase.from("users").delete().eq("id", userId);

      if (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
          { error: "Failed to delete user" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "User deleted successfully",
      });
    } else {
      // Soft delete (deactivate)
      const { data: user, error } = await supabase
        .from("users")
        .update({ isActive: false })
        .eq("id", userId)
        .select("id, name, email, isActive")
        .single();

      if (error) {
        console.error("Error deactivating user:", error);
        return NextResponse.json(
          { error: "Failed to deactivate user" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        data: user,
        message: "User deactivated successfully",
      });
    }
  } catch (error) {
    console.error("Error in DELETE /api/users/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
