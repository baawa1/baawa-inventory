import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserRole, getRolePermissions, RolePermissions } from "@/lib/auth-rbac";

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
  return async (req: NextRequest) => {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = session.user as any;

    return handler(authenticatedReq);
  };
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
          { error: `Role ${allowedRoles.join(" or ")} required` },
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
          { error: `Permission ${requiredPermission} required` },
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
