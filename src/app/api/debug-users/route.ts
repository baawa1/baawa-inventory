import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Simplified debug version of users API
export async function GET() {
  try {
    console.log("=== DEBUG USERS API ===");

    // Check session
    const session = await getServerSession(authOptions);
    console.log("Session:", session ? "Found" : "None");
    console.log("User role:", session?.user?.role);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin role required" },
        { status: 403 }
      );
    }

    // Try database connection
    const supabase = await createServerSupabaseClient();
    console.log("Supabase client created");

    // Simple query
    const { data: users, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, role")
      .limit(3);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        {
          error: "Database error",
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log("Users found:", users?.length || 0);

    return NextResponse.json({
      success: true,
      count: users?.length || 0,
      users: users || [],
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
