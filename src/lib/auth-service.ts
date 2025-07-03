import { prisma } from "./db";
import { AuditLogger } from "./utils/audit-logger";
import { AccountLockout } from "./utils/account-lockout";
import * as bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  emailVerified: boolean;
}

export interface AuthValidationResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  details?: string;
}

/**
 * Sanitize error for logging to prevent sensitive information disclosure
 */
function sanitizeError(error: any): string {
  if (typeof error === "string") return "Authentication operation failed";
  if (error?.message) return "Authentication operation failed";
  return "Authentication operation failed";
}

export class AuthenticationService {
  /**
   * Validate user credentials and return user data if valid
   */
  async validateCredentials(
    email: string,
    password: string,
    request?: NextRequest
  ): Promise<AuthValidationResult> {
    try {
      // Extract IP address for lockout checking
      const ipAddress = this.getClientIpAddress(request);

      // Check if email is locked out
      const emailLockoutStatus = await AccountLockout.checkLockoutStatus(
        email,
        "email"
      );
      if (emailLockoutStatus.isLocked) {
        const message = AccountLockout.getLockoutMessage(emailLockoutStatus);
        await AuditLogger.logLoginFailed(
          email,
          `Account locked: ${message}`,
          request
        );
        return { success: false, error: "ACCOUNT_LOCKED", details: message };
      }

      // Check if IP is locked out
      const ipLockoutStatus = await AccountLockout.checkLockoutStatus(
        ipAddress,
        "ip"
      );
      if (ipLockoutStatus.isLocked) {
        const message = AccountLockout.getLockoutMessage(ipLockoutStatus);
        await AuditLogger.logLoginFailed(
          email,
          `IP locked: ${message}`,
          request
        );
        return { success: false, error: "IP_LOCKED", details: message };
      }

      // Get user from database using Prisma
      const user = await prisma.user.findFirst({
        where: {
          email: email,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          password: true,
          firstName: true,
          lastName: true,
          role: true,
          userStatus: true,
          emailVerified: true,
        },
      });

      if (!user) {
        await AuditLogger.logLoginFailed(email, "User not found", request);
        return { success: false, error: "INVALID_CREDENTIALS" };
      }

      // Check if email is verified
      if (!user.emailVerified) {
        await AuditLogger.logLoginFailed(email, "Email not verified", request);
        return { success: false, error: "UNVERIFIED_EMAIL" };
      }

      // Check user status
      const statusValidation = this.validateUserStatus(user.userStatus);
      if (!statusValidation.success) {
        await AuditLogger.logLoginFailed(
          email,
          `User status: ${user.userStatus}`,
          request
        );
        return statusValidation;
      }

      // Check if password exists - fail immediately if null
      if (!user.password) {
        await AuditLogger.logLoginFailed(email, "No password set", request);
        return { success: false, error: "INVALID_CREDENTIALS" };
      }

      // Verify password with bcrypt
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        await AuditLogger.logLoginFailed(email, "Invalid password", request);
        return { success: false, error: "INVALID_CREDENTIALS" };
      }

      // Update last login timestamp
      await this.updateLastLogin(user.id);

      // Reset failed attempts on successful login
      await AccountLockout.resetFailedAttempts(user.email, ipAddress);

      // Log successful login
      await AuditLogger.logLoginSuccess(user.id, user.email, request);

      return {
        success: true,
        user: {
          id: user.id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          status: user.userStatus || "PENDING",
          emailVerified: user.emailVerified,
        },
      };
    } catch (error) {
      // Use sanitized error logging
      console.error("Authentication operation failed:", sanitizeError(error));
      return { success: false, error: "AUTHENTICATION_FAILED" };
    }
  }

  /**
   * Validate user status for login eligibility
   */
  private validateUserStatus(status: string | null): AuthValidationResult {
    switch (status) {
      case "PENDING":
        return { success: false, error: "PENDING_VERIFICATION" };
      case "REJECTED":
        return { success: false, error: "ACCOUNT_REJECTED" };
      case "SUSPENDED":
        return { success: false, error: "ACCOUNT_SUSPENDED" };
      case "VERIFIED":
      case "APPROVED":
        return { success: true };
      default:
        return { success: false, error: "ACCOUNT_INACTIVE" };
    }
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: number): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastLogin: new Date(),
        },
      });
    } catch (error) {
      console.error("Authentication operation failed:", sanitizeError(error));
    }
  }

  /**
   * Update user's last logout timestamp
   */
  async updateLastLogout(userId: number): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastLogout: new Date(),
        },
      });
    } catch (error) {
      console.error("Authentication operation failed:", sanitizeError(error));
    }
  }

  /**
   * Update user's last activity timestamp
   */
  async updateLastActivity(userId: number): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastActivity: new Date(),
        },
      });
    } catch (error) {
      console.error("Authentication operation failed:", sanitizeError(error));
    }
  }

  /**
   * Refresh user data from database
   */
  async refreshUserData(userId: number): Promise<Partial<AuthUser> | null> {
    try {
      console.log("Auth service: Refreshing user data for ID", userId);
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          isActive: true,
        },
        select: {
          role: true,
          userStatus: true,
          emailVerified: true,
        },
      });

      if (!user) {
        console.warn("Auth service: No user found for ID", userId);
        return null;
      }

      const result = {
        role: user.role,
        status: user.userStatus || "PENDING",
        emailVerified: user.emailVerified,
      };

      console.log("Auth service: Returning refreshed data:", result);
      return result;
    } catch (error) {
      console.error("Authentication operation failed:", sanitizeError(error));
      return null;
    }
  }

  /**
   * Extract client IP address from request headers
   */
  private getClientIpAddress(request?: NextRequest): string {
    if (!request) return "unknown";

    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const cfConnectingIp = request.headers.get("cf-connecting-ip");

    return (
      forwarded?.split(",")[0]?.trim() || realIp || cfConnectingIp || "unknown"
    );
  }
}

// Export singleton instance
export const authService = new AuthenticationService();
