import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Debug endpoint to check authentication
export async function GET(request: NextRequest) {
  try {
    console.log("=== DEBUG API CALL ===");
    console.log("Headers:", Object.fromEntries(request.headers.entries()));

    const session = await getServerSession(authOptions);
    console.log("Session:", session);

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "Authentication required",
          debug: {
            hasSession: !!session,
            hasUser: !!session?.user,
            cookies: request.headers.get("cookie") || "No cookies",
          },
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: session.user,
      debug: {
        hasSession: true,
        userRole: session.user.role,
        userStatus: session.user.status,
      },
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
