import { prisma } from "./db";
import { AuditLogger } from "./utils/audit-logger";
import { AccountLockout } from "./utils/account-lockout";
import * as bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import type { AuthUser, UserRole, UserStatus } from "@/types/user";
import { logger } from "./logger";

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
          password: true, // Maps to password_hash in DB via @map
          firstName: true, // Maps to first_name in DB via @map
          lastName: true, // Maps to last_name in DB via @map
          role: true,
          userStatus: true, // Maps to user_status in DB via @map
          emailVerified: true, // Maps to email_verified in DB via @map
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
          role: user.role as UserRole,
          status: (user.userStatus as UserStatus) || "PENDING",
          emailVerified: user.emailVerified,
        },
      };
    } catch (error) {
      // Use sanitized error logging
      logger.error("Authentication operation failed", {
        error: sanitizeError(error),
      });
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
      logger.error("Authentication operation failed", {
        error: sanitizeError(error),
      });
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
      logger.error("Authentication operation failed", {
        error: sanitizeError(error),
      });
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
      logger.error("Authentication operation failed", {
        error: sanitizeError(error),
      });
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
        role: user.role as UserRole,
        status: (user.userStatus as UserStatus) || "PENDING",
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

  /**
   * Register a new user, send verification email, and notify admins
   */
  async registerUser(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<{
    success: boolean;
    user?: AuthUser;
    message?: string;
    error?: string;
    requiresVerification?: boolean;
  }> {
    try {
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
        select: { id: true },
      });
      if (existingUser) {
        return {
          success: false,
          error: "User with this email already exists",
        };
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Generate email verification token
      const {
        rawToken: verificationToken,
        hashedToken: hashedVerificationToken,
        expires: verificationExpires,
      } = require("@/lib/utils/token-security").TokenSecurity.generateEmailVerificationToken(
        32
      );

      // Create the user
      const user = await prisma.user.create({
        data: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: hashedPassword,
          role: "EMPLOYEE",
          isActive: true,
          userStatus: "PENDING",
          emailVerified: false,
          emailVerificationToken: hashedVerificationToken,
          emailVerificationExpires: verificationExpires,
          emailNotifications: true,
          marketingEmails: false,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          userStatus: true,
        },
      });

      // Send verification email
      try {
        const verificationLink = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`;
        await require("@/lib/email").emailService.sendVerificationEmail(
          userData.email,
          {
            firstName: userData.firstName,
            verificationLink,
            expiresInHours: 24,
          }
        );
      } catch (emailError) {
        console.error("Error sending verification email:", emailError);
        // Don't fail registration if email fails
      }

      // Send admin notification for new user registration
      try {
        const approvalLink = `${process.env.NEXTAUTH_URL}/admin`;
        const registrationDate = new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        await require("@/lib/utils/admin-notifications").notifyAdmins(
          async (adminEmails: string[]) => {
            await require("@/lib/email").emailService.sendAdminNewUserNotification(
              adminEmails,
              {
                userFirstName: userData.firstName,
                userLastName: userData.lastName,
                userEmail: userData.email,
                userCompany: "",
                approvalLink,
                registrationDate,
              }
            );
          }
        );
      } catch (notificationError) {
        console.error("Error sending admin notification:", notificationError);
      }

      return {
        success: true,
        user: {
          id: user.id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role as UserRole,
          status: (user.userStatus as UserStatus) || "PENDING",
          emailVerified: false,
        },
        message:
          "Registration successful! Please check your email to verify your account.",
        requiresVerification: true,
      };
    } catch (error) {
      console.error("Registration error:", sanitizeError(error));
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  /**
   * Request password reset: generate token, store, and send email
   */
  async requestPasswordReset(email: string): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      // Check if user exists
      const user = await prisma.user.findFirst({
        where: {
          email,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
        },
      });

      // Always return success to prevent email enumeration
      if (user) {
        // Generate secure hashed reset token
        const { rawToken, hashedToken } =
          require("@/lib/utils/token-security").TokenSecurity.generateSecureToken(
            32
          );
        const resetTokenExpiry =
          require("@/lib/utils/token-security").TokenSecurity.generateExpiry(1); // 1 hour

        // Save hashed token to database
        await prisma.user.update({
          where: { id: user.id },
          data: {
            resetToken: hashedToken,
            resetTokenExpires: resetTokenExpiry,
          },
        });

        // Send email with raw token
        const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}`;
        try {
          await require("@/lib/email").emailService.sendPasswordResetEmail(
            email,
            {
              firstName: user.firstName,
              resetLink: resetUrl,
              expiresInHours: 1,
            }
          );
        } catch (emailError) {
          console.error("Failed to send reset email:", emailError);
        }
      }
      return {
        success: true,
        message:
          "If an account with that email exists, a reset link has been sent.",
      };
    } catch (error) {
      console.error("Forgot password error:", sanitizeError(error));
      return {
        success: false,
        message:
          "If an account with that email exists, a reset link has been sent.",
        error: "Internal server error",
      };
    }
  }

  /**
   * Reset password using a valid reset token
   */
  async resetPassword(
    token: string,
    password: string
  ): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      // Find users with non-expired reset tokens
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          resetToken: {
            not: null,
          },
          resetTokenExpires: {
            gte: new Date(),
          },
        },
        select: {
          id: true,
          email: true,
          resetToken: true,
        },
      });

      // Check each user's hashed token against the provided token
      let validUser = null;
      for (const user of users) {
        if (
          user.resetToken &&
          (await require("@/lib/utils/token-security").TokenSecurity.verifyToken(
            token,
            user.resetToken
          ))
        ) {
          validUser = user;
          break;
        }
      }

      if (!validUser) {
        return {
          success: false,
          error: "Invalid or expired reset token",
        };
      }

      // Hash the new password
      const hashedPassword = await require("bcryptjs").hash(password, 12);

      // Update user with new password and clear reset token
      await prisma.user.update({
        where: { id: validUser.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpires: null,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        message: "Password reset successfully",
      };
    } catch (error) {
      console.error("Reset password error:", sanitizeError(error));
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  /**
   * Verify email using a verification token
   */
  async verifyEmail(token: string): Promise<{
    success: boolean;
    message?: string;
    user?: Partial<AuthUser>;
    error?: string;
    shouldRefreshSession?: boolean;
  }> {
    try {
      // Find all users with verification tokens that haven't expired
      const users = await prisma.user.findMany({
        where: {
          emailVerificationToken: { not: null },
          emailVerificationExpires: { gte: new Date() },
          userStatus: "PENDING",
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          emailVerificationToken: true,
          emailVerificationExpires: true,
          userStatus: true,
          emailVerified: true,
        },
      });

      // Check token against each user's hashed token
      let matchedUser = null;
      for (const user of users) {
        if (user.emailVerificationToken) {
          const isValid =
            await require("@/lib/utils/token-security").TokenSecurity.verifyEmailToken(
              token,
              user.emailVerificationToken
            );
          if (isValid) {
            matchedUser = user;
            break;
          }
        }
      }

      if (!matchedUser) {
        return {
          success: false,
          error: "Invalid or expired verification token",
        };
      }

      // Check if user is already verified
      if (matchedUser.emailVerified || matchedUser.userStatus !== "PENDING") {
        return {
          success: false,
          error: "Email is already verified",
        };
      }

      // Update user as email verified
      const updatedUser = await prisma.user.update({
        where: { id: matchedUser.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
          userStatus: "VERIFIED",
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          userStatus: true,
          emailVerified: true,
        },
      });

      return {
        success: true,
        message:
          "Email verified successfully! Your account is now pending admin approval.",
        user: {
          id: updatedUser.id.toString(),
          email: updatedUser.email,
          name: updatedUser.firstName,
          status: (updatedUser.userStatus as UserStatus) || "VERIFIED",
          emailVerified: updatedUser.emailVerified,
        },
        shouldRefreshSession: true,
      };
    } catch (error) {
      console.error("Verify email error:", sanitizeError(error));
      return {
        success: false,
        error: "Internal server error",
      };
    }
  }

  /**
   * Resend verification email for a user
   */
  async resendVerificationEmail(email: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          firstName: true,
          email: true,
          userStatus: true,
          emailVerified: true,
        },
      });

      if (!user) {
        return { success: false, error: "User not found" };
      }

      // Check if user is already verified
      if (user.emailVerified || user.userStatus !== "PENDING") {
        return { success: false, error: "Email is already verified" };
      }

      // Generate new verification token
      const {
        rawToken: verificationToken,
        hashedToken: hashedVerificationToken,
        expires: verificationExpires,
      } = require("@/lib/utils/token-security").TokenSecurity.generateEmailVerificationToken(
        32
      );

      // Update user with new token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: hashedVerificationToken,
          emailVerificationExpires: verificationExpires,
        },
      });

      // Send new verification email
      try {
        const verificationLink = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`;
        await require("@/lib/email").emailService.sendVerificationEmail(email, {
          firstName: user.firstName,
          verificationLink,
          expiresInHours: 24,
        });
      } catch (emailError) {
        console.error("Error sending verification email:", emailError);
        return { success: false, error: "Failed to send verification email" };
      }

      return {
        success: true,
        message: "New verification email sent successfully!",
      };
    } catch (error) {
      console.error("Resend verification email error:", sanitizeError(error));
      return { success: false, error: "Internal server error" };
    }
  }

  /**
   * Refresh user session data by userId
   */
  async refreshUserSession(userId: number): Promise<{
    success: boolean;
    user?: AuthUser;
    error?: string;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          userStatus: true,
          emailVerified: true,
        },
      });
      if (!user) {
        return { success: false, error: "User not found" };
      }
      return {
        success: true,
        user: {
          id: user.id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role as UserRole,
          status: (user.userStatus as UserStatus) || "PENDING",
          emailVerified: user.emailVerified,
        },
      };
    } catch (error) {
      console.error("Error refreshing session:", sanitizeError(error));
      return { success: false, error: "Internal server error" };
    }
  }

  /**
   * Validate a password reset token
   */
  async validateResetToken(token: string): Promise<{
    valid: boolean;
    error?: string;
  }> {
    try {
      // Find users with non-expired reset tokens
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          resetToken: {
            not: null,
          },
          resetTokenExpires: {
            gte: new Date(),
          },
        },
        select: {
          id: true,
          resetToken: true,
        },
      });
      let validUser = null;
      for (const user of users) {
        if (
          user.resetToken &&
          (await require("@/lib/utils/token-security").TokenSecurity.verifyToken(
            token,
            user.resetToken
          ))
        ) {
          validUser = user;
          break;
        }
      }
      if (!validUser) {
        return { valid: false, error: "Invalid or expired token" };
      }
      return { valid: true };
    } catch (error) {
      console.error("Token validation error:", sanitizeError(error));
      return { valid: false, error: "Internal server error" };
    }
  }
}

// Export singleton instance
export const authService = new AuthenticationService();
