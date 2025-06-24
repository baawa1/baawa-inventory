import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import {
  userIdSchema,
  updateUserSchema,
  validateRequest,
} from "@/lib/validations";
import { withPermission, AuthenticatedRequest } from "@/lib/api-middleware";
import { emailService } from "@/lib/email";

interface RouteParams {
  params: { id: string };
}

// GET /api/users/[id] - Get a specific user
export async function GET(request: NextRequest, { params }: RouteParams) {
  const handler = withPermission("canManageUsers")(async (
    authRequest: AuthenticatedRequest
  ) => {
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
          "id, first_name, last_name, email, role, is_active, user_status, created_at, last_login"
        )
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }
        console.error("Error fetching user:", error);
        return NextResponse.json(
          { error: "Failed to fetch user" },
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
        userStatus: user.user_status,
        createdAt: user.created_at,
        lastLogin: user.last_login,
      };

      return NextResponse.json(transformedUser);
    } catch (error) {
      console.error("Error in GET /api/users/[id]:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });

  return handler(request as AuthenticatedRequest);
}

// PUT /api/users/[id] - Update a user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const handler = withPermission("canManageUsers")(async (
    authRequest: AuthenticatedRequest
  ) => {
    try {
      const supabase = await createServerSupabaseClient();
      const { id } = params;
      const body = await authRequest.json();

      console.log("PUT /api/users/[id] - Received data:", { id, body });

      // Validate ID
      const userId = parseInt(id);
      if (isNaN(userId)) {
        return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
      }

      // Check if user exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("id, email, role, first_name, last_name, user_status")
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

      // Prepare update data with correct field names
      const updateData: any = {};

      if (body.firstName) updateData.first_name = body.firstName;
      if (body.lastName) updateData.last_name = body.lastName;
      if (body.email) updateData.email = body.email;
      if (body.role) updateData.role = body.role;
      if (body.phone) updateData.phone = body.phone;
      if (body.isActive !== undefined) updateData.is_active = body.isActive;

      // Hash password if provided
      if (body.password && body.password.trim() !== "") {
        updateData.password_hash = await bcrypt.hash(body.password, 12);
      }

      console.log("Updating user with data:", updateData);

      // Update the user
      const { data: user, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId)
        .select(
          "id, first_name, last_name, email, role, is_active, created_at, last_login"
        )
        .single();

      if (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
          { error: "Failed to update user" },
          { status: 500 }
        );
      }

      // Check if role changed and send notification email
      if (body.role && body.role !== existingUser.role) {
        try {
          const adminName = authRequest.user?.name || "Administrator";
          const dashboardUrl =
            process.env.NEXTAUTH_URL || "http://localhost:3000";

          await emailService.sendRoleChangeEmail(user.email, {
            firstName: user.first_name,
            oldRole: existingUser.role,
            newRole: user.role,
            changedBy: adminName,
            dashboardLink: `${dashboardUrl}/dashboard`,
          });
        } catch (emailError) {
          console.error("Failed to send role change email:", emailError);
          // Don't fail the entire operation if email fails
        }
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

      console.log("Successfully updated user:", transformedUser);

      return NextResponse.json(transformedUser);
    } catch (error) {
      console.error("Error in PUT /api/users/[id]:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });

  return handler(request as AuthenticatedRequest);
}

// DELETE /api/users/[id] - Deactivate a user (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const handler = withPermission("canManageUsers")(async (
    authRequest: AuthenticatedRequest
  ) => {
    try {
      const supabase = await createServerSupabaseClient();
      const { id } = params;
      const { searchParams } = new URL(authRequest.url);
      const hardDelete = searchParams.get("hard") === "true";

      // Validate ID
      const userId = parseInt(id);
      if (isNaN(userId)) {
        return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
      }

      // Check if user exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("id, first_name, last_name, email")
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
          .eq("user_id", userId)
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
        const { error } = await supabase
          .from("users")
          .delete()
          .eq("id", userId);

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
          .update({ is_active: false })
          .eq("id", userId)
          .select("id, first_name, last_name, email, is_active")
          .single();

        if (error) {
          console.error("Error deactivating user:", error);
          return NextResponse.json(
            { error: "Failed to deactivate user" },
            { status: 500 }
          );
        }

        // Transform response to camelCase
        const transformedUser = {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          isActive: user.is_active,
        };

        return NextResponse.json({
          data: transformedUser,
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
  });

  return handler(request as AuthenticatedRequest);
}
