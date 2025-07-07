/**
 * Centralized API Authentication Middleware
 * Provides consistent authentication and authorization across all API endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { validateUserAuthorization, type UserRole } from "@/lib/roles";
import { PERMISSIONS } from "@/lib/roles";
import { ERROR_MESSAGES } from "@/lib/constants";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: string;
  emailVerified: boolean;
}

export interface AuthenticatedRequest extends NextRequest {
  user: AuthenticatedUser;
}

export type AuthRequirement = {
  permission?: keyof typeof PERMISSIONS;
  roles?: UserRole[];
  requireEmailVerified?: boolean;
};

/**
 * Centralized authentication middleware
 */
export function withAuth<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<Response>,
  requirements: AuthRequirement = {}
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      // Get session
      const session = await getServerSession(authOptions);

      if (!session) {
        return NextResponse.json(
          { error: ERROR_MESSAGES.UNAUTHORIZED },
          { status: 401 }
        );
      }

      const { user } = session;

      // Validate user data completeness
      if (!user.id || !user.role || !user.status) {
        return NextResponse.json(
          { error: "Incomplete user session data" },
          { status: 400 }
        );
      }

      // Check email verification if required
      if (requirements.requireEmailVerified && !user.emailVerified) {
        return NextResponse.json(
          { error: "Email verification required" },
          { status: 403 }
        );
      }

      // Check authorization based on requirements
      if (requirements.permission) {
        const authResult = validateUserAuthorization(
          user.role,
          user.status,
          requirements.permission
        );

        if (!authResult.authorized) {
          return NextResponse.json(
            { error: authResult.reason || ERROR_MESSAGES.FORBIDDEN },
            { status: 403 }
          );
        }
      }

      // Check specific roles if provided
      if (
        requirements.roles &&
        !requirements.roles.includes(user.role as UserRole)
      ) {
        return NextResponse.json(
          { error: ERROR_MESSAGES.FORBIDDEN },
          { status: 403 }
        );
      }

      // Create authenticated request
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = user as AuthenticatedUser;

      // Call the handler
      return await handler(authenticatedRequest, ...args);
    } catch (error) {
      console.error("Authentication middleware error:", error);
      return NextResponse.json(
        { error: ERROR_MESSAGES.INTERNAL_ERROR },
        { status: 500 }
      );
    }
  };
}

/**
 * POS-specific authentication middleware
 */
export function withPOSAuth<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<Response>
) {
  return withAuth(handler, {
    permission: "POS_ACCESS",
    requireEmailVerified: false,
  });
}

/**
 * Admin-only authentication middleware
 */
export function withAdminAuth<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<Response>
) {
  return withAuth(handler, {
    permission: "USER_MANAGEMENT",
    requireEmailVerified: true,
  });
}

/**
 * Inventory management authentication middleware
 */
export function withInventoryAuth<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<Response>
) {
  return withAuth(handler, {
    permission: "INVENTORY_WRITE",
    requireEmailVerified: false,
  });
}

/**
 * Sales management authentication middleware
 */
export function withSalesAuth<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<Response>
) {
  return withAuth(handler, {
    permission: "SALES_WRITE",
    requireEmailVerified: false,
  });
}

/**
 * Generic permission check for any API endpoint
 */
export async function checkPermission(
  permission: keyof typeof PERMISSIONS
): Promise<{ authorized: boolean; user?: AuthenticatedUser; error?: string }> {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return { authorized: false, error: ERROR_MESSAGES.UNAUTHORIZED };
    }

    const { user } = session;

    if (!user.id || !user.role || !user.status) {
      return { authorized: false, error: "Incomplete user session data" };
    }

    const authResult = validateUserAuthorization(
      user.role,
      user.status,
      permission
    );

    if (!authResult.authorized) {
      return {
        authorized: false,
        error: authResult.reason || ERROR_MESSAGES.FORBIDDEN,
      };
    }

    return {
      authorized: true,
      user: user as AuthenticatedUser,
    };
  } catch (error) {
    console.error("Permission check error:", error);
    return {
      authorized: false,
      error: ERROR_MESSAGES.INTERNAL_ERROR,
    };
  }
}

/**
 * Rate limiting wrapper (can be extended later)
 */
export function withRateLimit<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<Response>,
  options: { requests: number; window: number } = {
    requests: 100,
    window: 60000,
  }
) {
  // For now, just pass through - can implement rate limiting later
  return handler;
}
