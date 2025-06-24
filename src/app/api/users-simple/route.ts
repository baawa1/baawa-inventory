import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { withPermission, AuthenticatedRequest } from "@/lib/api-middleware";

// Simplified version of GET /api/users for debugging
export const GET = withPermission("canManageUsers")(async function (
  request: AuthenticatedRequest
) {
  try {
    console.log("=== SIMPLE USERS API DEBUG ===");
    console.log("Request URL:", request.url);

    const supabase = await createServerSupabaseClient();
    console.log("Supabase client created successfully");

    // Simple query without complex filtering
    const { data: users, error } = await supabase
      .from("users")
      .select(
        "id, first_name, last_name, email, role, is_active, user_status, email_verified, created_at"
      )
      .limit(10);

    console.log("Database query result:");
    console.log("- Error:", error);
    console.log("- Users count:", users?.length || 0);

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
      })) || [];

    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error("Error in GET /api/users-simple:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
