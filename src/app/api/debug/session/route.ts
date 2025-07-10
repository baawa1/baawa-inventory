import { auth } from "../../../../../auth";
import { NextRequest, NextResponse } from "next/server";
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          authenticated: false,
          message: "No session found",
        },
        { status: 401 }
      );
    }

    // Return detailed session information for debugging
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        status: session.user.status,
        isEmailVerified: session.user.isEmailVerified,
      },
      middlewareChecks: {
        isApproved: session.user.status === "APPROVED",
        hasValidRole: ["ADMIN", "MANAGER", "STAFF"].includes(session.user.role),
        canAccessPOS:
          session.user.status === "APPROVED" &&
          ["ADMIN", "MANAGER", "STAFF"].includes(session.user.role),
      },
    });
  } catch (error) {
    console.error("Session debug error:", error);
    return NextResponse.json(
      {
        error: "Failed to check session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
