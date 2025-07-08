import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AuthenticationService } from "@/lib/auth-service";
import { withAuthRateLimit } from "@/lib/rate-limit";

async function handleRefreshSession() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const authService = new AuthenticationService();
    const result = await authService.refreshUserSession(
      parseInt(session.user.id)
    );
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "User not found" },
        { status: result.error === "User not found" ? 404 : 500 }
      );
    }

    return NextResponse.json({ user: result.user });
  } catch (error) {
    console.error("Error refreshing session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply rate limiting
export const POST = withAuthRateLimit(handleRefreshSession);
