import { prisma } from "@/lib/db";
import { AuditLogger } from "./audit-logger";

export interface LockoutStatus {
  isLocked: boolean;
  remainingTime?: number; // in seconds
  nextAttemptAllowed?: Date;
  failedAttempts?: number;
}

/**
 * Account lockout mechanism with progressive delays
 */
export class AccountLockout {
  // Lockout thresholds and delays (in minutes)
  private static readonly LOCKOUT_THRESHOLDS = [
    { attempts: 3, delayMinutes: 5 }, // 3 attempts: 5 min lockout
    { attempts: 5, delayMinutes: 15 }, // 5 attempts: 15 min lockout
    { attempts: 7, delayMinutes: 60 }, // 7 attempts: 1 hour lockout
    { attempts: 10, delayMinutes: 240 }, // 10 attempts: 4 hours lockout
    { attempts: 15, delayMinutes: 1440 }, // 15+ attempts: 24 hours lockout
  ];

  /**
   * Check if an account or IP is currently locked out
   */
  static async checkLockoutStatus(
    identifier: string,
    type: "email" | "ip"
  ): Promise<LockoutStatus> {
    try {
      // Get failed attempts in the last 24 hours
      const failedAttempts = await AuditLogger.getFailedLoginAttempts(
        type === "ip" ? identifier : "unknown",
        type === "email" ? identifier : undefined,
        24 // Look back 24 hours
      );

      if (failedAttempts === 0) {
        return { isLocked: false, failedAttempts: 0 };
      }

      // Find the appropriate lockout threshold
      const lockoutRule = this.getLockoutRule(failedAttempts);

      if (!lockoutRule) {
        return { isLocked: false, failedAttempts };
      }

      // Get the timestamp of the last failed attempt
      const lastFailedAttempt = await this.getLastFailedAttempt(
        identifier,
        type
      );

      if (!lastFailedAttempt) {
        return { isLocked: false, failedAttempts };
      }

      // Calculate when the lockout expires
      const lockoutExpiry = new Date(
        lastFailedAttempt.getTime() + lockoutRule.delayMinutes * 60 * 1000
      );

      const now = new Date();

      if (now < lockoutExpiry) {
        // Still locked out
        const remainingTime = Math.ceil(
          (lockoutExpiry.getTime() - now.getTime()) / 1000
        );

        return {
          isLocked: true,
          remainingTime,
          nextAttemptAllowed: lockoutExpiry,
          failedAttempts,
        };
      }

      // Lockout has expired
      return { isLocked: false, failedAttempts };
    } catch (error) {
      console.error("Error checking lockout status:", error);
      // Fail open for availability
      return { isLocked: false };
    }
  }

  /**
   * Get the last failed login attempt timestamp
   */
  private static async getLastFailedAttempt(
    identifier: string,
    type: "email" | "ip"
  ): Promise<Date | null> {
    try {
      const where: any = {
        action: "LOGIN_FAILED",
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      };

      if (type === "email") {
        where.userEmail = identifier;
      } else if (identifier !== "unknown") {
        // Only add IP address filter if it's not "unknown"
        where.ip_address = identifier;
      }

      const lastAttempt = await prisma.auditLog.findFirst({
        where,
        orderBy: { created_at: "desc" },
        select: { created_at: true },
      });

      return lastAttempt?.created_at || null;
    } catch (error) {
      console.error("Error getting last failed attempt:", error);
      return null;
    }
  }

  /**
   * Get the appropriate lockout rule for the number of failed attempts
   */
  private static getLockoutRule(
    failedAttempts: number
  ): { attempts: number; delayMinutes: number } | null {
    // Find the highest threshold that the failed attempts exceed
    for (let i = this.LOCKOUT_THRESHOLDS.length - 1; i >= 0; i--) {
      const threshold = this.LOCKOUT_THRESHOLDS[i];
      if (failedAttempts >= threshold.attempts) {
        return threshold;
      }
    }
    return null;
  }

  /**
   * Reset failed attempts for an identifier (e.g., after successful login)
   */
  static async resetFailedAttempts(
    email: string,
    ipAddress: string
  ): Promise<void> {
    try {
      // For this implementation, we rely on the natural expiry of audit logs
      // In a production system, you might want to mark attempts as "resolved"
      // or maintain a separate lockout table

      // Log that the lockout has been reset
      await AuditLogger.logAuthEvent({
        action: "LOGIN_SUCCESS", // This will naturally reset the failed attempt count
        userEmail: email,
        ipAddress,
        success: true,
        details: { lockoutReset: true },
      });
    } catch (error) {
      console.error("Error resetting failed attempts:", error);
    }
  }

  /**
   * Get user-friendly lockout message
   */
  static getLockoutMessage(status: LockoutStatus): string {
    if (!status.isLocked) {
      return "";
    }

    const remainingMinutes = Math.ceil((status.remainingTime || 0) / 60);

    if (remainingMinutes < 60) {
      return `Account temporarily locked. Please try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""}.`;
    }

    const remainingHours = Math.ceil(remainingMinutes / 60);
    return `Account temporarily locked. Please try again in ${remainingHours} hour${remainingHours !== 1 ? "s" : ""}.`;
  }

  /**
   * Check if lockout should be applied based on failed attempts
   */
  static shouldApplyLockout(failedAttempts: number): boolean {
    return this.getLockoutRule(failedAttempts) !== null;
  }

  /**
   * Get warning message for users approaching lockout
   */
  static getWarningMessage(failedAttempts: number): string | null {
    if (failedAttempts === 0) return null;

    const nextThreshold = this.LOCKOUT_THRESHOLDS.find(
      (threshold) => failedAttempts < threshold.attempts
    );

    if (!nextThreshold) {
      return "Your account will be locked for 24 hours after the next failed attempt.";
    }

    const attemptsRemaining = nextThreshold.attempts - failedAttempts;
    const lockoutDuration = nextThreshold.delayMinutes;

    if (lockoutDuration < 60) {
      return `${attemptsRemaining} attempt${attemptsRemaining !== 1 ? "s" : ""} remaining before ${lockoutDuration}-minute lockout.`;
    } else {
      const hours = lockoutDuration / 60;
      return `${attemptsRemaining} attempt${attemptsRemaining !== 1 ? "s" : ""} remaining before ${hours}-hour lockout.`;
    }
  }
}
