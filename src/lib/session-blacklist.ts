/**
 * Session Blacklist Management
 * Handles server-side session invalidation and blacklisting
 */

import { prisma } from "./db";
import { logger } from "./logger";

export interface BlacklistedSession {
  id: string;
  userId: number;
  reason: string;
  blacklistedAt: Date;
  expiresAt: Date;
}

export class SessionBlacklist {
  /**
   * Add a session to the blacklist
   */
  static async blacklistSession(
    sessionId: string,
    userId: number,
    reason: string = "manual_logout"
  ): Promise<void> {
    try {
      // Calculate expiration (24 hours from now)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.sessionBlacklist.create({
        data: {
          sessionId,
          userId,
          reason,
          blacklistedAt: new Date(),
          expiresAt,
        },
      });

      logger.security("Session blacklisted", {
        sessionId: sessionId.slice(-8), // Only log last 8 chars for security
        userId,
        reason,
      });
    } catch (error) {
      logger.error("Failed to blacklist session", {
        error: error instanceof Error ? error.message : "Unknown error",
        sessionId: sessionId.slice(-8),
        userId,
      });
    }
  }

  /**
   * Check if a session is blacklisted
   */
  static async isSessionBlacklisted(sessionId: string): Promise<boolean> {
    try {
      const blacklistedSession = await prisma.sessionBlacklist.findFirst({
        where: {
          sessionId,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      return !!blacklistedSession;
    } catch (error) {
      logger.error("Failed to check session blacklist", {
        error: error instanceof Error ? error.message : "Unknown error",
        sessionId: sessionId.slice(-8),
      });
      // Fail open for availability
      return false;
    }
  }

  /**
   * Blacklist all sessions for a user
   */
  static async blacklistAllUserSessions(
    userId: number,
    reason: string = "security_logout"
  ): Promise<void> {
    try {
      // We can't get all active sessions easily, so we'll create a user-based blacklist entry
      // This will be checked in the JWT callback
      const sessionId = `user_${userId}_${Date.now()}`;
      await this.blacklistSession(sessionId, userId, reason);

      logger.security("All user sessions blacklisted", {
        userId,
        reason,
      });
    } catch (error) {
      logger.error("Failed to blacklist all user sessions", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
      });
    }
  }

  /**
   * Clean up expired blacklist entries
   */
  static async cleanupExpiredEntries(): Promise<void> {
    try {
      const result = await prisma.sessionBlacklist.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      logger.info("Cleaned up expired blacklist entries", {
        deletedCount: result.count,
      });
    } catch (error) {
      logger.error("Failed to cleanup expired blacklist entries", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get blacklisted sessions for a user
   */
  static async getUserBlacklistedSessions(
    userId: number
  ): Promise<BlacklistedSession[]> {
    try {
      const sessions = await prisma.sessionBlacklist.findMany({
        where: {
          userId,
          expiresAt: {
            gt: new Date(),
          },
        },
        select: {
          sessionId: true,
          userId: true,
          reason: true,
          blacklistedAt: true,
          expiresAt: true,
        },
      });

      return sessions.map((session: any) => ({
        id: session.sessionId,
        userId: session.userId,
        reason: session.reason,
        blacklistedAt: session.blacklistedAt,
        expiresAt: session.expiresAt,
      }));
    } catch (error) {
      logger.error("Failed to get user blacklisted sessions", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
      });
      return [];
    }
  }
}
