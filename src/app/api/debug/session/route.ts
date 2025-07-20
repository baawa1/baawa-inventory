import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { USER_STATUS } from "@/lib/constants";
import { USER_ROLES } from "@/lib/auth/roles";

export const GET = withAuth(async (_request: AuthenticatedRequest) => {
  try {
    // Return detailed session information for debugging
    return NextResponse.json({
      authenticated: true,
      user: {
        id: _request.user.id,
        email: _request.user.email,
        name: _request.user.name,
        role: _request.user.role,
        status: _request.user.status,
        isEmailVerified: _request.user.isEmailVerified,
      },
      middlewareChecks: {
        isApproved: _request.user.status === USER_STATUS.APPROVED,
        hasValidRole: [
          USER_ROLES.ADMIN,
          USER_ROLES.MANAGER,
          USER_ROLES.STAFF,
        ].includes(_request.user.role),
        canAccessDashboard:
          _request.user.status === USER_STATUS.APPROVED &&
          [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF].includes(
            _request.user.role
          ),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in debug session:", error);
    return NextResponse.json(
      { error: "Failed to get session debug info" },
      { status: 500 }
    );
  }
});
