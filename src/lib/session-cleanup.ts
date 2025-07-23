/**
 * Session Cleanup Service
 * Handles cleanup of expired sessions and blacklist entries
 */

import { logger } from "./logger";

// Placeholder for SessionBlacklist until the actual implementation is created
class SessionBlacklist {
  static async cleanupExpiredEntries(): Promise<void> {
    // TODO: Implement actual session blacklist cleanup
    logger.info("Session blacklist cleanup placeholder called");
  }
}

export class SessionCleanupService {
  private static instance: SessionCleanupService;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): SessionCleanupService {
    if (!SessionCleanupService.instance) {
      SessionCleanupService.instance = new SessionCleanupService();
    }
    return SessionCleanupService.instance;
  }

  /**
   * Start the cleanup service
   */
  start(): void {
    if (this.cleanupInterval) {
      logger.warn("Session cleanup service already running");
      return;
    }

    // Run cleanup every hour
    this.cleanupInterval = setInterval(
      async () => {
        await this.performCleanup();
      },
      60 * 60 * 1000
    ); // 1 hour

    // Run initial cleanup
    this.performCleanup();

    logger.info("Session cleanup service started");
  }

  /**
   * Stop the cleanup service
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info("Session cleanup service stopped");
    }
  }

  /**
   * Perform cleanup of expired sessions and blacklist entries
   */
  private async performCleanup(): Promise<void> {
    try {
      logger.info("Starting session cleanup");

      // Clean up expired blacklist entries
      await SessionBlacklist.cleanupExpiredEntries();

      logger.info("Session cleanup completed");
    } catch (error) {
      logger.error("Session cleanup failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Force cleanup (for manual execution)
   */
  async forceCleanup(): Promise<void> {
    await this.performCleanup();
  }
}

// Export singleton instance
export const sessionCleanupService = SessionCleanupService.getInstance();
