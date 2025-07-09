import { NextRequest, NextResponse } from "next/server";
import { sessionCleanupService } from "@/lib/session-cleanup";
import { withAuth } from "@/lib/api-auth-middleware";

async function handleCleanupSessions(request: NextRequest) {
  try {
    // Only allow admin users to trigger cleanup
    const user = (request as any).user;
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await sessionCleanupService.forceCleanup();

    return NextResponse.json({
      success: true,
      message: "Session cleanup completed",
    });
  } catch (error) {
    console.error("Session cleanup error:", error);
    return NextResponse.json(
      { error: "Failed to cleanup sessions" },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handleCleanupSessions, {
  roles: ["ADMIN"],
  requireEmailVerified: true,
});
