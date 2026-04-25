import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { ErrorSanitizer } from './error-sanitizer';
import { logger } from '@/lib/logger';
import { createAuditLog } from '@/lib/audit';
import { AuditLogAction } from '@/types/audit';
import { getClientIp } from './request-ip';

export type AuditAction = AuditLogAction;

export interface AuditRequestLike {
  headers?: Headers;
  method?: string;
  url?: string;
}

const RECENT_AUTH_ACTIONS: AuditLogAction[] = [
  AuditLogAction.LOGIN_SUCCESS,
  AuditLogAction.LOGIN_FAILED,
  AuditLogAction.LOGIN_BLOCKED,
  AuditLogAction.LOGOUT,
  AuditLogAction.REGISTRATION,
  AuditLogAction.PASSWORD_RESET_REQUEST,
  AuditLogAction.PASSWORD_RESET_SUCCESS,
  AuditLogAction.EMAIL_VERIFICATION,
  AuditLogAction.SESSION_EXPIRED,
  AuditLogAction.SESSION_BLACKLISTED,
  AuditLogAction.SUSPICIOUS_ACTIVITY,
  AuditLogAction.RATE_LIMIT_EXCEEDED,
  AuditLogAction.ACCOUNT_LOCKED,
  AuditLogAction.ACCESS_DENIED,
  AuditLogAction.AUTHENTICATION_REQUIRED,
  AuditLogAction.INVALID_SESSION,
  AuditLogAction.ACCOUNT_NOT_APPROVED,
  AuditLogAction.AUTHORIZATION_FAILED,
  AuditLogAction.BACKUP_CREATED,
  AuditLogAction.BACKUP_DOWNLOADED,
  AuditLogAction.ADMIN_USER_APPROVED,
  AuditLogAction.ADMIN_USER_REJECTED,
  AuditLogAction.ROLE_CHANGED,
];

function normalizeUserEmail(userEmail?: string): string | undefined {
  const normalizedEmail = userEmail?.trim().toLowerCase();
  return normalizedEmail || undefined;
}

function buildAuthIdentifierFilter(
  ipAddress?: string,
  userEmail?: string
): Prisma.AuditLogWhereInput | null {
  const filters: Prisma.AuditLogWhereInput[] = [];
  const normalizedEmail = normalizeUserEmail(userEmail);

  if (ipAddress && ipAddress !== 'unknown') {
    filters.push({ ip_address: ipAddress });
  }

  if (normalizedEmail) {
    filters.push({
      new_values: {
        path: ['userEmail'],
        equals: normalizedEmail,
      },
    });
  }

  if (filters.length === 0) {
    return null;
  }

  return filters.length === 1 ? filters[0] : { OR: filters };
}

function getDefaultTableName(action: AuditAction): string {
  switch (action) {
    case AuditLogAction.BACKUP_CREATED:
    case AuditLogAction.BACKUP_DOWNLOADED:
      return 'backup_logs';
    case AuditLogAction.REGISTRATION:
    case AuditLogAction.PASSWORD_RESET_REQUEST:
    case AuditLogAction.PASSWORD_RESET_SUCCESS:
    case AuditLogAction.EMAIL_VERIFICATION:
    case AuditLogAction.ADMIN_USER_APPROVED:
    case AuditLogAction.ADMIN_USER_REJECTED:
    case AuditLogAction.ROLE_CHANGED:
    case AuditLogAction.ACCOUNT_SUSPENDED:
    case AuditLogAction.ACCOUNT_REACTIVATED:
      return 'users';
    default:
      return 'auth';
  }
}

export interface AuditLogData {
  action: AuditAction;
  userId?: number;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  success: boolean;
  errorMessage?: string;
  tableName?: string;
  recordId?: number | null;
}

/**
 * Extract client IP and user agent from request with enhanced security info
 */
function extractRequestInfo(request?: AuditRequestLike): {
  ipAddress: string;
  userAgent: string;
  securityInfo: Record<string, unknown>;
} {
  const headers = request?.headers;

  if (!request) {
    return {
      ipAddress: 'unknown',
      userAgent: 'unknown',
      securityInfo: {},
    };
  }

  // Extract IP address from various headers (prioritize most reliable sources)
  const forwarded = headers?.get('x-forwarded-for');
  const ipAddress = getClientIp(request);

  const userAgent = headers?.get('user-agent') || 'unknown';

  // Collect additional security-relevant information
  const securityInfo = {
    origin: headers?.get('origin'),
    referer: headers?.get('referer'),
    acceptLanguage: headers?.get('accept-language'),
    acceptEncoding: headers?.get('accept-encoding'),
    connection: headers?.get('connection'),
    upgradeInsecureRequests: headers?.get('upgrade-insecure-requests'),
    secFetchSite: headers?.get('sec-fetch-site'),
    secFetchMode: headers?.get('sec-fetch-mode'),
    secFetchDest: headers?.get('sec-fetch-dest'),
    forwardedChain: forwarded, // Full forwarded chain for analysis
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
  };

  return {
    ipAddress,
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
    request?: AuditRequestLike
  ): Promise<void> {
    try {
      const { ipAddress, userAgent, securityInfo } =
        extractRequestInfo(request);
      const normalizedEmail = normalizeUserEmail(data.userEmail);
      const resolvedIpAddress =
        data.ipAddress && data.ipAddress !== 'unknown'
          ? data.ipAddress
          : ipAddress;

      const auditDetails = {
        success: data.success,
        userEmail: normalizedEmail ?? null,
        errorMessage: data.errorMessage ?? null,
        details: data.details ?? null,
        securityInfo,
      };

      await createAuditLog({
        userId: data.userId ?? null,
        action: data.action,
        tableName: data.tableName ?? getDefaultTableName(data.action),
        recordId: data.recordId ?? data.userId ?? null,
        ipAddress: resolvedIpAddress === 'unknown' ? undefined : resolvedIpAddress,
        userAgent: data.userAgent || userAgent || undefined,
        newValues: auditDetails,
      });
    } catch (error) {
      // Use sanitized error logging to prevent sensitive data exposure
      ErrorSanitizer.logError(error, 'Audit logging failed', {
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
    request?: AuditRequestLike
  ): Promise<void> {
    await this.logAuthEvent(
      {
        action: AuditLogAction.LOGIN_SUCCESS,
        userId,
        userEmail,
        success: true,
        tableName: 'users',
        recordId: userId,
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
    request?: AuditRequestLike
  ): Promise<void> {
    await this.logAuthEvent(
      {
        action: AuditLogAction.LOGIN_FAILED,
        userEmail,
        success: false,
        errorMessage: reason,
      },
      request
    );
  }

  /**
   * Log a lockout event without inflating failed-login counters.
   */
  static async logAccountLocked(
    identifierType: 'email' | 'ip',
    identifier: string,
    details: {
      failedAttempts?: number;
      remainingTime?: number;
      nextAttemptAllowed?: Date;
    },
    request?: AuditRequestLike
  ): Promise<void> {
    await this.logAuthEvent(
      {
        action: AuditLogAction.ACCOUNT_LOCKED,
        userEmail: identifierType === 'email' ? identifier : undefined,
        ipAddress: identifierType === 'ip' ? identifier : undefined,
        success: false,
        details: {
          identifierType,
          failedAttempts: details.failedAttempts ?? null,
          remainingTime: details.remainingTime ?? null,
          nextAttemptAllowed: details.nextAttemptAllowed?.toISOString() ?? null,
        },
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
    request?: AuditRequestLike
  ): Promise<void> {
    await this.logAuthEvent(
      {
        action: AuditLogAction.LOGOUT,
        userId,
        userEmail,
        success: true,
        tableName: 'users',
        recordId: userId,
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
    request?: AuditRequestLike
  ): Promise<void> {
    await this.logAuthEvent(
      {
        action: AuditLogAction.REGISTRATION,
        userEmail,
        success: true,
        details: { role },
        tableName: 'users',
      },
      request
    );
  }

  /**
   * Log password reset request
   */
  static async logPasswordResetRequest(
    userEmail: string,
    request?: AuditRequestLike
  ): Promise<void> {
    await this.logAuthEvent(
      {
        action: AuditLogAction.PASSWORD_RESET_REQUEST,
        userEmail,
        success: true,
        tableName: 'users',
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
    request?: AuditRequestLike
  ): Promise<void> {
    await this.logAuthEvent(
      {
        action: AuditLogAction.PASSWORD_RESET_SUCCESS,
        userId,
        userEmail,
        success: true,
        tableName: 'users',
        recordId: userId,
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
    request?: AuditRequestLike
  ): Promise<void> {
    await this.logAuthEvent(
      {
        action: AuditLogAction.EMAIL_VERIFICATION,
        userId,
        userEmail,
        success: true,
        tableName: 'users',
        recordId: userId,
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
    request?: AuditRequestLike
  ): Promise<void> {
    const action =
      newStatus === 'APPROVED'
        ? AuditLogAction.ADMIN_USER_APPROVED
        : AuditLogAction.ADMIN_USER_REJECTED;

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
        tableName: 'users',
        recordId: targetUserId,
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
    request?: AuditRequestLike
  ): Promise<void> {
    await this.logAuthEvent(
      {
        action: AuditLogAction.ROLE_CHANGED,
        userId: adminUserId,
        userEmail: targetUserEmail,
        success: true,
        details: {
          targetUserId,
          oldRole,
          newRole,
        },
        tableName: 'users',
        recordId: targetUserId,
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
      action: AuditLogAction.SESSION_EXPIRED,
      userId,
      userEmail,
      success: true,
      tableName: 'users',
      recordId: userId,
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
    request?: AuditRequestLike
  ): Promise<void> {
    await this.logAuthEvent(
      {
        action: AuditLogAction.SESSION_BLACKLISTED,
        userId,
        userEmail,
        success: true,
        details: {
          reason,
          sessionId: sessionId?.slice(-8), // Only log last 8 chars
        },
        tableName: 'users',
        recordId: userId,
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
    request?: AuditRequestLike
  ): Promise<void> {
    await this.logAuthEvent(
      {
        action: AuditLogAction.SUSPICIOUS_ACTIVITY,
        userId,
        userEmail,
        success: false,
        details: {
          description,
          severity: 'high',
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
    request?: AuditRequestLike
  ): Promise<void> {
    await this.logAuthEvent(
      {
        action: AuditLogAction.RATE_LIMIT_EXCEEDED,
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
      const where: Prisma.AuditLogWhereInput = {
        action: {
          in: RECENT_AUTH_ACTIONS,
        },
        ...(userId ? { user_id: userId } : {}),
      };

      return await prisma.auditLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
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
      logger.error('Failed to fetch audit events', {
        userId,
        action: 'getRecentAuthEvents',
        tableName: 'auditLog',
        error: error instanceof Error ? error.message : String(error),
      });
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
      const recentEvents = await this.getRecentLoginEvents(
        ipAddress,
        email,
        hoursBack
      );

      let failedAttempts = 0;

      for (const event of recentEvents) {
        if (event.action === AuditLogAction.LOGIN_SUCCESS) {
          break;
        }

        if (event.action === AuditLogAction.LOGIN_FAILED) {
          failedAttempts += 1;
        }
      }

      return failedAttempts;
    } catch (error) {
      logger.error('Failed to count failed login attempts', {
        userId: 'unknown', // No specific user for rate limiting
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  /**
   * Get the timestamp of the latest failed login attempt in the current failure streak.
   */
  static async getLastFailedLoginAttempt(
    ipAddress: string,
    email?: string,
    hoursBack: number = 24
  ): Promise<Date | null> {
    try {
      const recentEvents = await this.getRecentLoginEvents(
        ipAddress,
        email,
        hoursBack
      );

      for (const event of recentEvents) {
        if (event.action === AuditLogAction.LOGIN_SUCCESS) {
          return null;
        }

        if (event.action === AuditLogAction.LOGIN_FAILED) {
          return event.created_at || null;
        }
      }

      return null;
    } catch (error) {
      logger.error('Failed to fetch last failed login attempt', {
        ipAddress,
        email,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  private static async getRecentLoginEvents(
    ipAddress: string,
    email?: string,
    hoursBack: number = 24
  ) {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const identifierFilter = buildAuthIdentifierFilter(ipAddress, email);

    if (!identifierFilter) {
      return [];
    }

    return prisma.auditLog.findMany({
      where: {
        created_at: { gte: since },
        action: {
          in: [AuditLogAction.LOGIN_FAILED, AuditLogAction.LOGIN_SUCCESS],
        },
        AND: [identifierFilter],
      },
      orderBy: { created_at: 'desc' },
      select: {
        action: true,
        created_at: true,
      },
    });
  }
}
