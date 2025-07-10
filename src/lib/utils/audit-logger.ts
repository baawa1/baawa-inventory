import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { ErrorSanitizer } from "./error-sanitizer";

export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "REGISTRATION"
  | "PASSWORD_RESET_REQUEST"
  | "PASSWORD_RESET_SUCCESS"
  | "EMAIL_VERIFICATION"
  | "ADMIN_USER_APPROVED"
  | "ADMIN_USER_REJECTED"
  | "ROLE_CHANGED"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_REACTIVATED"
  | "SESSION_EXPIRED"
  | "SESSION_BLACKLISTED"
  | "SUSPICIOUS_ACTIVITY"
  | "RATE_LIMIT_EXCEEDED";

export interface AuditLogData {
  action: AuditAction;
  userId?: number;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
}

/**
 * Extract client IP and user agent from request with enhanced security info
 */
function extractRequestInfo(request?: NextRequest): {
  ipAddress: string;
  userAgent: string;
  securityInfo: Record<string, any>;
} {
  if (!request) {
    return {
      ipAddress: "unknown",
      userAgent: "unknown",
      securityInfo: {},
    };
  }

  // Extract IP address from various headers (prioritize most reliable sources)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  const remoteAddr = request.headers.get("x-remote-addr");

  const ipAddress =
    cfConnectingIp || // Cloudflare (most reliable)
    realIp || // Nginx/Apache
    forwarded?.split(",")[0] || // Load balancer
    remoteAddr ||
    "unknown";

  const userAgent = request.headers.get("user-agent") || "unknown";

  // Collect additional security-relevant information
  const securityInfo = {
    origin: request.headers.get("origin"),
    referer: request.headers.get("referer"),
    acceptLanguage: request.headers.get("accept-language"),
    acceptEncoding: request.headers.get("accept-encoding"),
    connection: request.headers.get("connection"),
    upgradeInsecureRequests: request.headers.get("upgrade-insecure-requests"),
    secFetchSite: request.headers.get("sec-fetch-site"),
    secFetchMode: request.headers.get("sec-fetch-mode"),
    secFetchDest: request.headers.get("sec-fetch-dest"),
    forwardedChain: forwarded, // Full forwarded chain for analysis
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
  };

  return {
    ipAddress: ipAddress.trim(),
    userAgent,
    securityInfo,
  };
}

/**
 * Audit logger for authentication and security events
 */
export class AuditLogger {
  /**
   * Log an authentication event with full context
   */
  static async logAuthEvent(
    data: AuditLogData,
    request?: NextRequest
  ): Promise<void> {
    try {
      const { ipAddress, userAgent, securityInfo } =
        extractRequestInfo(request);

      // Combine user details with security info
      const auditDetails = {
        ...data.details,
        securityInfo,
        success: data.success,
        errorMessage: data.errorMessage,
      };

      await prisma.auditLog.create({
        data: {
          action: data.action,
          user_id: data.userId || null,
          table_name: "users", // Default table for auth events
          record_id: data.userId || null,
          ip_address: ipAddress === "unknown" ? null : ipAddress,
          user_agent: data.userAgent || userAgent,
          new_values: JSON.stringify(auditDetails),
        },
      });
    } catch (error) {
      // Use sanitized error logging to prevent sensitive data exposure
      ErrorSanitizer.logError(error, "Audit logging failed", {
        action: data.action,
        userId: data.userId,
        // Don't log full details to prevent sensitive data in error logs
      });
    }
  }

  /**
   * Log successful login
   */
  static async logLoginSuccess(
    userId: number,
    userEmail: string,
    request?: NextRequest
  ): Promise<void> {
    await this.logAuthEvent(
      {
        action: "LOGIN_SUCCESS",
        userId,
        userEmail,
        success: true,
      },
      request
    );
  }

  /**
   * Log failed login attempt
   */
  static async logLoginFailed(
    userEmail: string,
    reason: string,
    request?: NextRequest
  ): Promise<void> {
    await this.logAuthEvent(
      {
        action: "LOGIN_FAILED",
        userEmail,
        success: false,
        errorMessage: reason,
      },
      request
    );
  }

  /**
   * Log user logout
   */
  static async logLogout(
    userId: number,
    userEmail: string,
    request?: NextRequest
  ): Promise<void> {
    await this.logAuthEvent(
      {
        action: "LOGOUT",
        userId,
        userEmail,
        success: true,
      },
      request
    );
  }

  /**
   * Log user registration
   */
  static async logRegistration(
    userEmail: string,
    role: string,
    request?: NextRequest
  ): Promise<void> {
    await this.logAuthEvent(
      {
        action: "REGISTRATION",
        userEmail,
        success: true,
        details: { role },
      },
      request
    );
  }

  /**
   * Log password reset request
   */
  static async logPasswordResetRequest(
    userEmail: string,
    request?: NextRequest
  ): Promise<void> {
    await this.logAuthEvent(
      {
        action: "PASSWORD_RESET_REQUEST",
        userEmail,
        success: true,
      },
      request
    );
  }

  /**
   * Log successful password reset
   */
  static async logPasswordResetSuccess(
    userId: number,
    userEmail: string,
    request?: NextRequest
  ): Promise<void> {
    await this.logAuthEvent(
      {
        action: "PASSWORD_RESET_SUCCESS",
        userId,
        userEmail,
        success: true,
      },
      request
    );
  }

  /**
   * Log email verification
   */
  static async logEmailVerification(
    userId: number,
    userEmail: string,
    request?: NextRequest
  ): Promise<void> {
    await this.logAuthEvent(
      {
        action: "EMAIL_VERIFICATION",
        userId,
        userEmail,
        success: true,
      },
      request
    );
  }

  /**
   * Log admin user approval/rejection
   */
  static async logUserStatusChange(
    adminUserId: number,
    targetUserId: number,
    targetUserEmail: string,
    newStatus: string,
    reason?: string,
    request?: NextRequest
  ): Promise<void> {
    const action =
      newStatus === "APPROVED" ? "ADMIN_USER_APPROVED" : "ADMIN_USER_REJECTED";

    await this.logAuthEvent(
      {
        action,
        userId: adminUserId,
        userEmail: targetUserEmail,
        success: true,
        details: {
          targetUserId,
          newStatus,
          reason,
        },
      },
      request
    );
  }

  /**
   * Log role changes
   */
  static async logRoleChange(
    adminUserId: number,
    targetUserId: number,
    targetUserEmail: string,
    oldRole: string,
    newRole: string,
    request?: NextRequest
  ): Promise<void> {
    await this.logAuthEvent(
      {
        action: "ROLE_CHANGED",
        userId: adminUserId,
        userEmail: targetUserEmail,
        success: true,
        details: {
          targetUserId,
          oldRole,
          newRole,
        },
      },
      request
    );
  }

  /**
   * Log session expiration
   */
  static async logSessionExpired(
    userId: number,
    userEmail: string
  ): Promise<void> {
    await this.logAuthEvent({
      action: "SESSION_EXPIRED",
      userId,
      userEmail,
      success: true,
    });
  }

  /**
   * Log session blacklisting
   */
  static async logSessionBlacklisted(
    userId: number,
    userEmail: string,
    reason: string,
    sessionId?: string,
    request?: NextRequest
  ): Promise<void> {
    await this.logAuthEvent(
      {
        action: "SESSION_BLACKLISTED",
        userId,
        userEmail,
        success: true,
        details: {
          reason,
          sessionId: sessionId?.slice(-8), // Only log last 8 chars
        },
      },
      request
    );
  }

  /**
   * Log suspicious activity
   */
  static async logSuspiciousActivity(
    description: string,
    userId?: number,
    userEmail?: string,
    request?: NextRequest
  ): Promise<void> {
    await this.logAuthEvent(
      {
        action: "SUSPICIOUS_ACTIVITY",
        userId,
        userEmail,
        success: false,
        details: {
          description,
          severity: "high",
        },
      },
      request
    );
  }

  /**
   * Log rate limit exceeded
   */
  static async logRateLimitExceeded(
    endpoint: string,
    userId?: number,
    userEmail?: string,
    request?: NextRequest
  ): Promise<void> {
    await this.logAuthEvent(
      {
        action: "RATE_LIMIT_EXCEEDED",
        userId,
        userEmail,
        success: false,
        details: {
          endpoint,
          timestamp: new Date().toISOString(),
        },
      },
      request
    );
  }

  /**
   * Get recent authentication events for monitoring
   */
  static async getRecentAuthEvents(
    limit: number = 100,
    userId?: number
  ): Promise<any[]> {
    try {
      const where = userId ? { user_id: userId } : {};

      return await prisma.auditLog.findMany({
        where,
        orderBy: { created_at: "desc" },
        take: limit,
        select: {
          id: true,
          action: true,
          user_id: true,
          table_name: true,
          record_id: true,
          ip_address: true,
          created_at: true,
          old_values: true,
          new_values: true,
        },
      });
    } catch (error) {
      console.error("Failed to fetch audit events:", error);
      return [];
    }
  }

  /**
   * Get failed login attempts in the last hour for rate limiting
   */
  static async getFailedLoginAttempts(
    ipAddress: string,
    email?: string,
    hoursBack: number = 1
  ): Promise<number> {
    try {
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

      const where: any = {
        action: "LOGIN_FAILED",
        created_at: { gte: since },
      };

      // Only add IP address filter if it's not "unknown"
      if (ipAddress !== "unknown") {
        if (email) {
          where.OR = [{ ip_address: ipAddress }, { userEmail: email }];
        } else {
          where.ip_address = ipAddress;
        }
      } else if (email) {
        // If IP is unknown but we have email, only filter by email
        where.userEmail = email;
      }

      return await prisma.auditLog.count({ where });
    } catch (error) {
      console.error("Failed to count failed login attempts:", error);
      return 0;
    }
  }
}
