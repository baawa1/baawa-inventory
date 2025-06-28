import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    // Fetch the latest user data from database
    const { data: user, error } = await supabase
      .from("users")
      .select(
        "id, email, first_name, last_name, role, user_status, email_verified"
      )
      .eq("id", parseInt(session.user.id))
      .eq("is_active", true)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return the updated user data that the client can use to update the session
    return NextResponse.json({
      user: {
        id: user.id.toString(),
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role,
        status: user.user_status,
        emailVerified: user.email_verified,
      },
    });
  } catch (error) {
    console.error("Error refreshing session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
