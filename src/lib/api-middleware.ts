import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserRole, getRolePermissions, RolePermissions } from "@/lib/auth-rbac";
import { withErrorHandling } from "@/lib/api-error-handler";

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withErrorHandling(async (req: NextRequest) => {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Validate user object structure instead of using type assertion
    const user = session.user;
    if (
      !user.id ||
      !user.email ||
      !user.role ||
      typeof user.id !== "string" ||
      typeof user.email !== "string" ||
      typeof user.role !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid user session", code: "INVALID_SESSION" },
        { status: 401 }
      );
    }

    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = {
      id: user.id,
      email: user.email,
      name: user.name || "",
      role: user.role as UserRole,
    };

    return handler(authenticatedReq);
  });
}

export function withRole(requiredRole: UserRole | UserRole[]) {
  return function (
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
  ) {
    return withAuth(async (req) => {
      const userRole = req.user!.role;

      // Admin always has access
      if (userRole === "ADMIN") {
        return handler(req);
      }

      const allowedRoles = Array.isArray(requiredRole)
        ? requiredRole
        : [requiredRole];

      if (!allowedRoles.includes(userRole)) {
        return NextResponse.json(
          {
            error: `Role ${allowedRoles.join(" or ")} required`,
            code: "INSUFFICIENT_ROLE",
          },
          { status: 403 }
        );
      }

      return handler(req);
    });
  };
}

export function withPermission(requiredPermission: keyof RolePermissions) {
  return function (
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
  ) {
    return withAuth(async (req) => {
      const userRole = req.user!.role;
      const permissions = getRolePermissions(userRole);

      if (!permissions[requiredPermission]) {
        return NextResponse.json(
          {
            error: `Permission ${requiredPermission} required`,
            code: "INSUFFICIENT_PERMISSION",
          },
          { status: 403 }
        );
      }

      return handler(req);
    });
  };
}

// Combined middleware for authentication, role, and permission checking
export function withAuthAndRole(
  requiredRole?: UserRole | UserRole[],
  requiredPermission?: keyof RolePermissions
) {
  return function (
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
  ) {
    let currentHandler = handler;

    // Apply permission check if required
    if (requiredPermission) {
      currentHandler = withPermission(requiredPermission)(currentHandler);
    }

    // Apply role check if required
    if (requiredRole) {
      currentHandler = withRole(requiredRole)(currentHandler);
    }

    // Apply auth check (always required)
    return withAuth(currentHandler);
  };
}
