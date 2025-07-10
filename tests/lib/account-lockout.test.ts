import { AccountLockout } from "@/lib/utils/account-lockout";
import { AuditLogger } from "@/lib/utils/audit-logger";

// Mock dependencies
jest.mock("@/lib/utils/audit-logger", () => ({
  AuditLogger: {
    getFailedLoginAttempts: jest.fn(),
    logLoginFailed: jest.fn(),
    logLoginSuccess: jest.fn(),
    logAuthEvent: jest.fn(),
  },
}));

describe("AccountLockout", () => {
  const mockAuditLogger = AuditLogger as jest.Mocked<typeof AuditLogger>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkLockoutStatus", () => {
    it("should return unlocked status when no failed attempts", async () => {
      mockAuditLogger.getFailedLoginAttempts.mockResolvedValue(0);

      const result = await AccountLockout.checkLockoutStatus(
        "test@example.com",
        "email"
      );

      expect(result.isLocked).toBe(false);
      expect(result.failedAttempts).toBe(0);
      expect(mockAuditLogger.getFailedLoginAttempts).toHaveBeenCalledWith(
        "unknown",
        "test@example.com",
        24
      );
    });

    it("should return unlocked status when failed attempts are below threshold", async () => {
      mockAuditLogger.getFailedLoginAttempts.mockResolvedValue(2);

      const result = await AccountLockout.checkLockoutStatus(
        "test@example.com",
        "email"
      );

      expect(result.isLocked).toBe(false);
      expect(result.failedAttempts).toBe(2);
    });

    it("should return locked status when failed attempts exceed threshold", async () => {
      mockAuditLogger.getFailedLoginAttempts.mockResolvedValue(5);

      // Mock the getLastFailedAttempt method
      const mockGetLastFailedAttempt = jest.spyOn(
        AccountLockout as any,
        "getLastFailedAttempt"
      );
      const mockDate = new Date("2023-01-01T10:00:00Z");
      mockGetLastFailedAttempt.mockResolvedValue(mockDate);

      const result = await AccountLockout.checkLockoutStatus(
        "test@example.com",
        "email"
      );

      expect(result.isLocked).toBe(true);
      expect(result.failedAttempts).toBe(5);
      expect(result.remainingTime).toBeDefined();
      expect(result.nextAttemptAllowed).toBeDefined();

      mockGetLastFailedAttempt.mockRestore();
    });

    it("should handle IP-based lockout", async () => {
      mockAuditLogger.getFailedLoginAttempts.mockResolvedValue(7);

      const mockGetLastFailedAttempt = jest.spyOn(
        AccountLockout as any,
        "getLastFailedAttempt"
      );
      const mockDate = new Date("2023-01-01T10:00:00Z");
      mockGetLastFailedAttempt.mockResolvedValue(mockDate);

      const result = await AccountLockout.checkLockoutStatus(
        "192.168.1.1",
        "ip"
      );

      expect(result.isLocked).toBe(true);
      expect(mockAuditLogger.getFailedLoginAttempts).toHaveBeenCalledWith(
        "192.168.1.1",
        undefined,
        24
      );

      mockGetLastFailedAttempt.mockRestore();
    });

    it("should return unlocked status when lockout has expired", async () => {
      mockAuditLogger.getFailedLoginAttempts.mockResolvedValue(5);

      const mockGetLastFailedAttempt = jest.spyOn(
        AccountLockout as any,
        "getLastFailedAttempt"
      );
      // Set last failed attempt to 2 hours ago (beyond 15-minute lockout)
      const mockDate = new Date(Date.now() - 2 * 60 * 60 * 1000);
      mockGetLastFailedAttempt.mockResolvedValue(mockDate);

      const result = await AccountLockout.checkLockoutStatus(
        "test@example.com",
        "email"
      );

      expect(result.isLocked).toBe(false);
      expect(result.failedAttempts).toBe(5);

      mockGetLastFailedAttempt.mockRestore();
    });

    it("should handle errors gracefully and fail open", async () => {
      mockAuditLogger.getFailedLoginAttempts.mockRejectedValue(
        new Error("Database error")
      );

      const result = await AccountLockout.checkLockoutStatus(
        "test@example.com",
        "email"
      );

      expect(result.isLocked).toBe(false);
    });
  });

  describe("shouldApplyLockout", () => {
    it("should return true for attempts at or above threshold", () => {
      expect(AccountLockout.shouldApplyLockout(3)).toBe(true);
      expect(AccountLockout.shouldApplyLockout(5)).toBe(true);
      expect(AccountLockout.shouldApplyLockout(7)).toBe(true);
      expect(AccountLockout.shouldApplyLockout(10)).toBe(true);
      expect(AccountLockout.shouldApplyLockout(15)).toBe(true);
    });

    it("should return false for attempts below threshold", () => {
      expect(AccountLockout.shouldApplyLockout(0)).toBe(false);
      expect(AccountLockout.shouldApplyLockout(1)).toBe(false);
      expect(AccountLockout.shouldApplyLockout(2)).toBe(false);
    });
  });

  describe("getLockoutMessage", () => {
    it("should return empty string for unlocked status", () => {
      const status = { isLocked: false, failedAttempts: 2 };
      const message = AccountLockout.getLockoutMessage(status);
      expect(message).toBe("");
    });

    it("should return message for short lockout duration", () => {
      const status = {
        isLocked: true,
        failedAttempts: 3,
        remainingTime: 180, // 3 minutes
      };
      const message = AccountLockout.getLockoutMessage(status);
      expect(message).toContain("3 minute");
    });

    it("should return message for long lockout duration", () => {
      const status = {
        isLocked: true,
        failedAttempts: 10,
        remainingTime: 7200, // 2 hours
      };
      const message = AccountLockout.getLockoutMessage(status);
      expect(message).toContain("2 hour");
    });

    it("should handle plural forms correctly", () => {
      const status = {
        isLocked: true,
        failedAttempts: 5,
        remainingTime: 60, // 1 minute
      };
      const message = AccountLockout.getLockoutMessage(status);
      expect(message).toContain("1 minute");
    });
  });

  describe("getWarningMessage", () => {
    it("should return null for no failed attempts", () => {
      const message = AccountLockout.getWarningMessage(0);
      expect(message).toBeNull();
    });

    it("should return warning for approaching 3-attempt threshold", () => {
      const message = AccountLockout.getWarningMessage(2);
      expect(message).toContain("1 attempt");
      expect(message).toContain("5-minute lockout");
    });

    it("should return warning for approaching 5-attempt threshold", () => {
      const message = AccountLockout.getWarningMessage(4);
      expect(message).toContain("1 attempt");
      expect(message).toContain("15-minute lockout");
    });

    it("should return warning for approaching 7-attempt threshold", () => {
      const message = AccountLockout.getWarningMessage(6);
      expect(message).toContain("1 attempt");
      expect(message).toContain("1-hour lockout");
    });

    it("should return warning for approaching 10-attempt threshold", () => {
      const message = AccountLockout.getWarningMessage(9);
      expect(message).toContain("1 attempt");
      expect(message).toContain("4-hour lockout");
    });

    it("should return warning for approaching 15-attempt threshold", () => {
      const message = AccountLockout.getWarningMessage(14);
      expect(message).toContain("1 attempt");
      expect(message).toContain("24-hour lockout");
    });

    it("should return final warning for 15+ attempts", () => {
      const message = AccountLockout.getWarningMessage(16);
      expect(message).toContain("24 hours");
    });

    it("should handle plural forms correctly", () => {
      const message = AccountLockout.getWarningMessage(1);
      expect(message).toContain("2 attempts");
    });
  });

  describe("resetFailedAttempts", () => {
    it("should reset failed attempts for email and IP", async () => {
      await AccountLockout.resetFailedAttempts(
        "test@example.com",
        "192.168.1.1"
      );

      expect(mockAuditLogger.logAuthEvent).toHaveBeenCalledWith(
        "login_success",
        "test@example.com",
        "Failed attempts reset after successful login",
        expect.any(Object)
      );
    });

    it("should handle reset with only email", async () => {
      await AccountLockout.resetFailedAttempts("test@example.com", "unknown");

      expect(mockAuditLogger.logAuthEvent).toHaveBeenCalledWith(
        "login_success",
        "test@example.com",
        "Failed attempts reset after successful login",
        expect.any(Object)
      );
    });
  });

  describe("edge cases", () => {
    it("should handle very high failed attempt counts", () => {
      expect(AccountLockout.shouldApplyLockout(100)).toBe(true);
    });

    it("should handle zero failed attempts", () => {
      expect(AccountLockout.shouldApplyLockout(0)).toBe(false);
    });

    it("should handle negative failed attempts", () => {
      expect(AccountLockout.shouldApplyLockout(-1)).toBe(false);
    });

    it("should handle exact threshold values", () => {
      expect(AccountLockout.shouldApplyLockout(3)).toBe(true);
      expect(AccountLockout.shouldApplyLockout(5)).toBe(true);
      expect(AccountLockout.shouldApplyLockout(7)).toBe(true);
      expect(AccountLockout.shouldApplyLockout(10)).toBe(true);
      expect(AccountLockout.shouldApplyLockout(15)).toBe(true);
    });
  });
});
