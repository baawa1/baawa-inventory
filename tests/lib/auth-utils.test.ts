// Mock Prisma client and dependencies FIRST (before imports)
import { ErrorSanitizer } from "@/lib/utils/error-sanitizer";
import { AccountLockout } from "@/lib/utils/account-lockout";
import { SecureTokenManager } from "@/lib/utils/secure-token-manager";
import { AuditLogger } from "@/lib/utils/audit-logger";
import { prisma } from "@/lib/db";

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock("@/lib/utils/audit-logger", () => ({
  AuditLogger: {
    getFailedLoginAttempts: jest.fn(),
    logLoginFailed: jest.fn(),
    logLoginSuccess: jest.fn(),
    logAuthEvent: jest.fn(),
  },
}));

const mockAuditLogger = AuditLogger as jest.Mocked<typeof AuditLogger>;

describe("Authentication Utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(prisma.auditLog, "findFirst").mockReset();
  });

  describe("ErrorSanitizer", () => {
    describe("sanitizeError", () => {
      it("should sanitize error objects", () => {
        const error = new Error("Database connection failed");
        const sanitized = ErrorSanitizer.sanitizeError(error);

        expect(sanitized.message).toBe("Database connection failed");
        expect(sanitized.type).toBe("Error");
        expect(sanitized.sanitized).toBe(true);
      });

      it("should sanitize error strings", () => {
        const error = "Database connection failed";
        const sanitized = ErrorSanitizer.sanitizeError(error);

        expect(sanitized.message).toBe("Database connection failed");
        expect(sanitized.type).toBe("StringError");
        expect(sanitized.sanitized).toBe(true);
      });

      it("should sanitize objects with sensitive data", () => {
        const error = {
          message: "Password validation failed",
          stack: "at validatePassword (/app/auth.js:123:45)",
          details: { password: "secret123", token: "abc123" },
        };
        const sanitized = ErrorSanitizer.sanitizeError(error);

        expect(sanitized.message).toContain("[REDACTED] validation failed");
        expect(sanitized.type).toBe("ObjectError");
        expect(sanitized.sanitized).toBe(true);
      });

      it("should handle null and undefined errors", () => {
        const nullError = ErrorSanitizer.sanitizeError(null);
        const undefinedError = ErrorSanitizer.sanitizeError(undefined);

        expect(nullError.message).toBe("Unknown error occurred");
        expect(undefinedError.message).toBe("Unknown error occurred");
      });
    });

    describe("logAuthError", () => {
      it("should log authentication errors safely", () => {
        const error = new Error("Database connection failed");
        const email = "test@example.com";
        const additionalData = { operation: "login", ip: "192.168.1.1" };

        ErrorSanitizer.logAuthError(error, email, additionalData);

        // Verify that the error was logged (mocked logger.error should be called)
        expect(require("@/lib/logger").logger.error).toHaveBeenCalledWith(
          "Authentication error",
          expect.objectContaining({
            error: expect.objectContaining({
              message: "Database connection failed",
              sanitized: true,
            }),
            email: "te***@example.com",
            operation: "login",
            ip: "192.168.1.1",
          })
        );
      });
    });
  });

  describe("AccountLockout", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe("checkLockoutStatus", () => {
      it("should return not locked when no failed attempts", async () => {
        mockAuditLogger.getFailedLoginAttempts.mockResolvedValue(0);
        (prisma.auditLog.findFirst as jest.Mock).mockResolvedValue(null);

        const status = await AccountLockout.checkLockoutStatus(
          "test@example.com",
          "email"
        );

        expect(status.isLocked).toBe(false);
        expect(status.failedAttempts).toBe(0);
      });

      it("should return locked after 5 failed attempts", async () => {
        mockAuditLogger.getFailedLoginAttempts.mockResolvedValue(5);
        const lastAttempt = new Date(Date.now() - 1000); // 1 second ago
        (prisma.auditLog.findFirst as jest.Mock).mockResolvedValue({
          created_at: lastAttempt,
        });

        const status = await AccountLockout.checkLockoutStatus(
          "test@example.com",
          "email"
        );

        expect(status.isLocked).toBe(true);
        expect(status.failedAttempts).toBe(5);
        expect(status.nextAttemptAllowed).toBeInstanceOf(Date);
      });

      it("should return locked after 15 failed attempts with 24-hour lockout", async () => {
        mockAuditLogger.getFailedLoginAttempts.mockResolvedValue(15);
        const lastAttempt = new Date(Date.now() - 1000); // 1 second ago
        (prisma.auditLog.findFirst as jest.Mock).mockResolvedValue({
          created_at: lastAttempt,
        });

        const status = await AccountLockout.checkLockoutStatus(
          "test@example.com",
          "email"
        );

        expect(status.isLocked).toBe(true);
        expect(status.failedAttempts).toBe(15);
        expect(status.nextAttemptAllowed).toBeInstanceOf(Date);
        expect(status.remainingTime).toBeGreaterThan(0);
      });
    });

    describe("getLockoutMessage", () => {
      it("should return appropriate message for different lockout levels", () => {
        const status1 = {
          isLocked: true,
          failedAttempts: 3,
          remainingTime: 300, // 5 minutes
          nextAttemptAllowed: new Date(Date.now() + 5 * 60 * 1000),
        };

        const status2 = {
          isLocked: true,
          failedAttempts: 10,
          remainingTime: 14400, // 4 hours
          nextAttemptAllowed: new Date(Date.now() + 240 * 60 * 1000),
        };

        const message1 = AccountLockout.getLockoutMessage(status1);
        const message2 = AccountLockout.getLockoutMessage(status2);

        expect(message1).toContain("5 minute");
        expect(message2).toContain("4 hour");
      });

      it("should handle non-locked status", () => {
        const status = {
          isLocked: false,
          failedAttempts: 2,
        };

        const message = AccountLockout.getLockoutMessage(status);

        expect(message).toBe("");
      });
    });

    describe("resetFailedAttempts", () => {
      it("should reset failed attempts for email and IP", async () => {
        await AccountLockout.resetFailedAttempts(
          "test@example.com",
          "192.168.1.1"
        );

        // Verify that the reset was logged
        expect(mockAuditLogger.logAuthEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            action: "LOGIN_SUCCESS",
            userEmail: "test@example.com",
            ipAddress: "192.168.1.1",
            success: true,
            details: { lockoutReset: true },
          })
        );
      });
    });
  });

  describe("SecureTokenManager", () => {
    describe("generateTokenPair", () => {
      it("should generate secure token pair", () => {
        const tokenPair = SecureTokenManager.generateTokenPair();

        expect(tokenPair.rawToken).toBeDefined();
        expect(tokenPair.hashedToken).toBeDefined();
        expect(tokenPair.rawToken).toHaveLength(64); // 32 bytes = 64 hex chars
        expect(tokenPair.hashedToken).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash format
      });

      it("should generate unique tokens", () => {
        const tokenPair1 = SecureTokenManager.generateTokenPair();
        const tokenPair2 = SecureTokenManager.generateTokenPair();

        expect(tokenPair1.rawToken).not.toBe(tokenPair2.rawToken);
        expect(tokenPair1.hashedToken).not.toBe(tokenPair2.hashedToken);
      });
    });

    describe("verifyToken", () => {
      it("should verify valid token", async () => {
        const tokenPair = SecureTokenManager.generateTokenPair();

        const result = await SecureTokenManager.verifyToken(
          tokenPair.rawToken,
          tokenPair.hashedToken
        );

        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it("should reject invalid token", async () => {
        const tokenPair = SecureTokenManager.generateTokenPair();

        const result = await SecureTokenManager.verifyToken(
          "invalid-token",
          tokenPair.hashedToken
        );

        expect(result.isValid).toBe(false);
        expect(result.error).toBe("Invalid token");
      });

      it("should handle missing token or hash", async () => {
        const result1 = await SecureTokenManager.verifyToken("", "hash");
        const result2 = await SecureTokenManager.verifyToken("token", "");
        const result3 = await SecureTokenManager.verifyToken("", "");

        expect(result1.isValid).toBe(false);
        expect(result1.error).toBe("Missing token or hash");
        expect(result2.isValid).toBe(false);
        expect(result2.error).toBe("Missing token or hash");
        expect(result3.isValid).toBe(false);
        expect(result3.error).toBe("Missing token or hash");
      });

      it("should handle verification errors", async () => {
        // Mock bcrypt to throw an error
        const bcrypt = require("bcryptjs");
        const originalCompare = bcrypt.compare;
        bcrypt.compare = jest.fn().mockRejectedValue(new Error("bcrypt error"));

        const result = await SecureTokenManager.verifyToken("token", "hash");

        expect(result.isValid).toBe(false);
        expect(result.error).toBe("Invalid token");

        // Restore original function
        bcrypt.compare = originalCompare;
      });
    });

    describe("generatePasswordResetToken", () => {
      it("should generate password reset token with expiration", () => {
        const result = SecureTokenManager.generatePasswordResetToken();

        expect(result.rawToken).toBeDefined();
        expect(result.hashedToken).toBeDefined();
        expect(result.expiresAt).toBeInstanceOf(Date);

        // Check expiration is 1 hour from now
        const now = new Date();
        const timeDiff = result.expiresAt.getTime() - now.getTime();
        expect(timeDiff).toBeGreaterThan(59 * 60 * 1000); // At least 59 minutes
        expect(timeDiff).toBeLessThan(61 * 60 * 1000); // Less than 61 minutes
      });
    });

    describe("generateEmailVerificationToken", () => {
      it("should generate email verification token with expiration", () => {
        const result = SecureTokenManager.generateEmailVerificationToken();

        expect(result.rawToken).toBeDefined();
        expect(result.hashedToken).toBeDefined();
        expect(result.expiresAt).toBeInstanceOf(Date);

        // Check expiration is 24 hours from now
        const now = new Date();
        const timeDiff = result.expiresAt.getTime() - now.getTime();
        expect(timeDiff).toBeGreaterThan(23 * 60 * 60 * 1000); // At least 23 hours
        expect(timeDiff).toBeLessThan(25 * 60 * 60 * 1000); // Less than 25 hours
      });
    });
  });
});
