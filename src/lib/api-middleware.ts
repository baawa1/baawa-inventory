import { NextRequest, NextResponse } from 'next/server';
import { auth } from '#root/auth';
import { hasRole, USER_ROLES } from './auth/roles';
import { AuditLogger } from './utils/audit-logger';
import { USER_STATUS } from './constants';
import type { UserRole } from '@/types/user';
// import { logger } from "./logger";

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
export function withAuth<T extends unknown[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // const requestId = Math.random().toString(36).substring(7);
    // const startTime = Date.now();

    // logger.info(`[${requestId}] Auth middleware - Request started`, {
    //   method: request.method,
    //   url: request.url,
    //   timestamp: new Date().toISOString(),
    // });

    try {
      // Get session from Auth.js
      // logger.info(`[${requestId}] Auth middleware - Getting session`);
      const session = await auth();

      if (!session?.user) {
        // logger.warn(`[${requestId}] Auth middleware - No session found`);
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // logger.info(`[${requestId}] Auth middleware - Session found`, {
      //   userId: session.user.id,
      //   userEmail: session.user.email,
      //   userRole: session.user.role,
      //   userStatus: session.user.status,
      //   isEmailVerified: session.user.isEmailVerified,
      // });

      // Validate user session data
      if (!session.user.id || !session.user.email || !session.user.role) {
        // logger.error(`[${requestId}] Auth middleware - Invalid session data`, {
        //   session: session.user,
        // });
        return NextResponse.json(
          { error: 'Invalid session data' },
          { status: 401 }
        );
      }

      // Check if user is active and approved
      if (!session.user.isEmailVerified) {
        // logger.warn(`[${requestId}] Auth middleware - Email not verified`, {
        //   userId: session.user.id,
        //   userEmail: session.user.email,
        // });
        return NextResponse.json(
          { error: 'Email verification required' },
          { status: 403 }
        );
      }

      if (session.user.status !== USER_STATUS.APPROVED) {
        // logger.warn(`[${requestId}] Auth middleware - Account not approved`, {
        //   userId: session.user.id,
        //   userEmail: session.user.email,
        //   status: session.user.status,
        // });
        return NextResponse.json(
          { error: 'Account not approved' },
          { status: 403 }
        );
      }

      // Create authenticated request with user data
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || `${session.user.email.split('@')[0]}`,
        role: session.user.role as UserRole,
        status: session.user.status,
        isEmailVerified: session.user.isEmailVerified,
      };

      // logger.info(`[${requestId}] Auth middleware - Authentication successful, calling handler`, {
      //   userId: authenticatedRequest.user.id,
      //   userEmail: authenticatedRequest.user.email,
      //   userRole: authenticatedRequest.user.role,
      // });

      const result = await handler(authenticatedRequest, ...args);

      // const endTime = Date.now();
      // const duration = endTime - startTime;

      // logger.info(`[${requestId}] Auth middleware - Handler completed`, {
      //   duration: `${duration}ms`,
      //   status: result.status,
      // });

      return result;
    } catch (error) {
      // const endTime = Date.now();
      // const duration = endTime - startTime;

      // Log the actual error for debugging
      // logger.error(`[${requestId}] Auth middleware error`, {
      //   duration: `${duration}ms`,
      //   error: error instanceof Error ? {
      //     message: error.message,
      //     stack: error.stack,
      //     name: error.name,
      //   } : error,
      // });

      // Return 401 for auth-specific errors, not 500
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
  };
}

/**
 * Permission-based middleware that requires specific roles
 */
export function withPermission<T extends unknown[]>(
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
              action: 'LOGIN_FAILED',
              userId: parseInt(request.user.id),
              userEmail: request.user.email,
              success: false,
              errorMessage: `Insufficient permissions. Required: ${allowedRoles.join(', ')}, Has: ${request.user.role}`,
            },
            request
          );

          return NextResponse.json(
            {
              error: 'Insufficient permissions',
              required: allowedRoles,
              current: request.user.role,
            },
            { status: 403 }
          );
        }

        return await handler(request, ...args);
      } catch (error) {
        console.error('Permission middleware error:', error);

        await AuditLogger.logAuthEvent(
          {
            action: 'LOGIN_FAILED',
            userId: parseInt(request.user.id),
            userEmail: request.user.email,
            success: false,
            errorMessage:
              error instanceof Error ? error.message : 'Unknown error',
          },
          request
        );

        return NextResponse.json(
          { error: 'Authorization failed' },
          { status: 403 }
        );
      }
    }
  );
}

/**
 * Admin-only middleware
 */
export function withAdminPermission<T extends unknown[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
) {
  return withPermission([USER_ROLES.ADMIN], handler);
}

/**
 * Manager+ middleware (Manager and Admin)
 */
export function withManagerPermission<T extends unknown[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
) {
  return withPermission([USER_ROLES.ADMIN, USER_ROLES.MANAGER], handler);
}

/**
 * Any authenticated user middleware
 */
export function withUserPermission<T extends unknown[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
) {
  return withPermission(
    [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF],
    handler
  );
}
