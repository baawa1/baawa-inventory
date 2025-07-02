import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

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
  | "SESSION_EXPIRED";

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
 * Extract client IP and user agent from request
 */
function extractRequestInfo(request?: NextRequest): {
  ipAddress: string;
  userAgent: string;
} {
  if (!request) {
    return {
      ipAddress: "unknown",
      userAgent: "unknown",
    };
  }

  // Extract IP address from various headers
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  
  const ipAddress = 
    forwarded?.split(",")[0] || 
    realIp || 
    cfConnectingIp || 
    "unknown";

  const userAgent = request.headers.get("user-agent") || "unknown";

  return {
    ipAddress: ipAddress.trim(),
    userAgent,
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
      const { ipAddress, userAgent } = extractRequestInfo(request);

      await prisma.auditLog.create({
        data: {
          action: data.action,
          userId: data.userId || null,
          userEmail: data.userEmail || null,
          ipAddress: data.ipAddress || ipAddress,
          userAgent: data.userAgent || userAgent,
          details: data.details ? JSON.stringify(data.details) : null,
          success: data.success,
          errorMessage: data.errorMessage || null,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      // Don't throw on audit logging failures - log to console instead
      console.error("Audit logging failed:", error);
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
    await this.logAuthEvent({
      action: "LOGIN_SUCCESS",
      userId,
      userEmail,
      success: true,
    }, request);
  }

  /**
   * Log failed login attempt
   */
  static async logLoginFailed(
    userEmail: string,
    reason: string,
    request?: NextRequest
  ): Promise<void> {
    await this.logAuthEvent({
      action: "LOGIN_FAILED",
      userEmail,
      success: false,
      errorMessage: reason,
    }, request);
  }

  /**
   * Log user logout
   */
  static async logLogout(
    userId: number,
    userEmail: string,
    request?: NextRequest
  ): Promise<void> {
    await this.logAuthEvent({
      action: "LOGOUT",
      userId,
      userEmail,
      success: true,
    }, request);
  }

  /**
   * Log user registration
   */
  static async logRegistration(
    userEmail: string,
    role: string,
    request?: NextRequest
  ): Promise<void> {
    await this.logAuthEvent({
      action: "REGISTRATION",
      userEmail,
      success: true,
      details: { role },
    }, request);
  }

  /**
   * Log password reset request
   */
  static async logPasswordResetRequest(
    userEmail: string,
    request?: NextRequest
  ): Promise<void> {
    await this.logAuthEvent({
      action: "PASSWORD_RESET_REQUEST",
      userEmail,
      success: true,
    }, request);
  }

  /**
   * Log successful password reset
   */
  static async logPasswordResetSuccess(
    userId: number,
    userEmail: string,
    request?: NextRequest
  ): Promise<void> {
    await this.logAuthEvent({
      action: "PASSWORD_RESET_SUCCESS",
      userId,
      userEmail,
      success: true,
    }, request);
  }

  /**
   * Log email verification
   */
  static async logEmailVerification(
    userId: number,
    userEmail: string,
    request?: NextRequest
  ): Promise<void> {
    await this.logAuthEvent({
      action: "EMAIL_VERIFICATION",
      userId,
      userEmail,
      success: true,
    }, request);
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
    const action = newStatus === "APPROVED" ? "ADMIN_USER_APPROVED" : "ADMIN_USER_REJECTED";
    
    await this.logAuthEvent({
      action,
      userId: adminUserId,
      userEmail: targetUserEmail,
      success: true,
      details: {
        targetUserId,
        newStatus,
        reason,
      },
    }, request);
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
    await this.logAuthEvent({
      action: "ROLE_CHANGED",
      userId: adminUserId,
      userEmail: targetUserEmail,
      success: true,
      details: {
        targetUserId,
        oldRole,
        newRole,
      },
    }, request);
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
   * Get recent authentication events for monitoring
   */
  static async getRecentAuthEvents(
    limit: number = 100,
    userId?: number
  ): Promise<any[]> {
    try {
      const where = userId ? { userId } : {};
      
      return await prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        take: limit,
        select: {
          id: true,
          action: true,
          userId: true,
          userEmail: true,
          ipAddress: true,
          success: true,
          errorMessage: true,
          timestamp: true,
          details: true,
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
        timestamp: { gte: since },
        success: false,
      };

      if (email) {
        where.OR = [
          { ipAddress },
          { userEmail: email }
        ];
      } else {
        where.ipAddress = ipAddress;
      }

      return await prisma.auditLog.count({ where });
    } catch (error) {
      console.error("Failed to count failed login attempts:", error);
      return 0;
    }
  }
}