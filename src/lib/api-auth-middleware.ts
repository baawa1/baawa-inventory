/**
 * Centralized API Authentication Middleware
 * Provides consistent authentication and authorization across all API endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../auth";
import { hasPermission } from "./auth/roles";
import { AuditLogger } from "./utils/audit-logger";
import { USER_STATUS } from "./constants";
import type { UserRole, UserStatus } from "@/types/user";

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: UserStatus;
  };
}

/**
 * POS Authentication Middleware
 * Allows ADMIN, MANAGER, and STAFF roles to access POS functionality
 */
export function withPOSAuth<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Get session from Auth.js
      const session = await auth();

      if (!session?.user) {
        await AuditLogger.logAuthEvent(
          {
            action: "LOGIN_FAILED",
            success: false,
            errorMessage: "No session found",
          },
          request
        );

        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      // Validate user session data
      if (!session.user.id || !session.user.email || !session.user.role) {
        await AuditLogger.logAuthEvent(
          {
            action: "LOGIN_FAILED",
            userEmail: session.user.email || undefined,
            success: false,
            errorMessage: "Invalid session data",
          },
          request
        );

        return NextResponse.json(
          { error: "Invalid session data" },
          { status: 401 }
        );
      }

      // Check if user has POS access permission
      if (!hasPermission(session.user.role, "POS_ACCESS")) {
        await AuditLogger.logAuthEvent(
          {
            action: "LOGIN_FAILED",
            userId: parseInt(session.user.id),
            userEmail: session.user.email,
            success: false,
            errorMessage: "Insufficient permissions for POS access",
          },
          request
        );

        return NextResponse.json(
          { error: "Insufficient permissions for POS access" },
          { status: 403 }
        );
      }

      // Check if user is approved
      if (session.user.status !== USER_STATUS.APPROVED) {
        await AuditLogger.logAuthEvent(
          {
            action: "LOGIN_FAILED",
            userId: parseInt(session.user.id),
            userEmail: session.user.email,
            success: false,
            errorMessage: `User status: ${session.user.status}`,
          },
          request
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
        status: session.user.status as UserStatus,
      };

      return await handler(authenticatedRequest, ...args);
    } catch (error) {
      console.error("POS Auth middleware error:", error);

      await AuditLogger.logAuthEvent(
        {
          action: "LOGIN_FAILED",
          success: false,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
        request
      );

      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 }
      );
    }
  };
}
