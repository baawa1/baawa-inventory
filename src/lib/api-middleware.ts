import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../auth";
import { hasRole, USER_ROLES } from "./auth/roles";
import { AuditLogger } from "./utils/audit-logger";
import { USER_STATUS } from "./constants";
import type { UserRole } from "@/types/user";

// Enhanced authenticated request interface
export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: string;
    isEmailVerified: boolean;
  };
}

/**
 * Authentication middleware that integrates with Auth.js v5
 */
export function withAuth<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      console.log("withAuth middleware called for:", request.nextUrl.pathname);
      // Get session from Auth.js
      const session = await auth();
      console.log("Session:", session ? "Found" : "Not found");

      if (!session?.user) {
        console.log("No session found in withAuth middleware");
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      // Validate user session data
      if (!session.user.id || !session.user.email || !session.user.role) {
        console.log("Invalid session data:", session.user);
        return NextResponse.json(
          { error: "Invalid session data" },
          { status: 401 }
        );
      }

      // Check if user is active and approved
      if (!session.user.isEmailVerified) {
        console.log("Email not verified for user:", session.user.email);
        return NextResponse.json(
          { error: "Email verification required" },
          { status: 403 }
        );
      }

      if (session.user.status !== USER_STATUS.APPROVED) {
        console.log(
          "Account not approved for user:",
          session.user.email,
          "Status:",
          session.user.status
        );
        return NextResponse.json(
          { error: "Account not approved" },
          { status: 403 }
        );
      }

      // Create authenticated request with user data
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || `${session.user.email.split("@")[0]}`,
        role: session.user.role as UserRole,
        status: session.user.status,
        isEmailVerified: session.user.isEmailVerified,
      };

      return await handler(authenticatedRequest, ...args);
    } catch (error) {
      console.error("Auth middleware error:", error);
      console.error(
        "Error stack:",
        error instanceof Error ? error.stack : "No stack"
      );

      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 }
      );
    }
  };
}

/**
 * Permission-based middleware that requires specific roles
 */
export function withPermission<T extends any[]>(
  allowedRoles: UserRole[],
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
) {
  return withAuth(
    async (
      request: AuthenticatedRequest,
      ...args: T
    ): Promise<NextResponse> => {
      try {
        // Check if user has required role
        if (!hasRole(request.user.role, allowedRoles)) {
          await AuditLogger.logAuthEvent(
            {
              action: "LOGIN_FAILED",
              userId: parseInt(request.user.id),
              userEmail: request.user.email,
              success: false,
              errorMessage: `Insufficient permissions. Required: ${allowedRoles.join(", ")}, Has: ${request.user.role}`,
            },
            request
          );

          return NextResponse.json(
            {
              error: "Insufficient permissions",
              required: allowedRoles,
              current: request.user.role,
            },
            { status: 403 }
          );
        }

        return await handler(request, ...args);
      } catch (error) {
        console.error("Permission middleware error:", error);

        await AuditLogger.logAuthEvent(
          {
            action: "LOGIN_FAILED",
            userId: parseInt(request.user.id),
            userEmail: request.user.email,
            success: false,
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
          },
          request
        );

        return NextResponse.json(
          { error: "Permission check failed" },
          { status: 500 }
        );
      }
    }
  );
}

/**
 * Admin-only middleware
 */
export function withAdminPermission<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
) {
  return withPermission([USER_ROLES.ADMIN], handler);
}

/**
 * Manager+ middleware (Manager and Admin)
 */
export function withManagerPermission<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
) {
  return withPermission([USER_ROLES.ADMIN, USER_ROLES.MANAGER], handler);
}

/**
 * Any authenticated user middleware
 */
export function withUserPermission<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
) {
  return withPermission(
    [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF],
    handler
  );
}
