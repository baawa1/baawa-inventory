import { authService } from "@/lib/auth-service";
import * as bcrypt from "bcryptjs";
import type { AuthUser, AppUser, UserRole, UserStatus } from "@/types/user";

// Mock the entire db module
jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock bcrypt
jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// Mock audit logger
jest.mock("@/lib/utils/audit-logger", () => ({
  AuditLogger: {
    logLoginFailed: jest.fn(),
    logLoginSuccess: jest.fn(),
  },
}));

// Mock account lockout
jest.mock("@/lib/utils/account-lockout", () => ({
  AccountLockout: {
    checkLockoutStatus: jest.fn(),
    getLockoutMessage: jest.fn(),
    resetFailedAttempts: jest.fn(),
  },
}));

// Get the mocked modules
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Import the mocked prisma after mocking
const { prisma } = require("@/lib/db");
const mockPrisma = prisma;

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock account lockout to return unlocked status by default
    const { AccountLockout } = require("@/lib/utils/account-lockout");
    AccountLockout.checkLockoutStatus.mockResolvedValue({ isLocked: false });
  });

  describe("validateCredentials", () => {
    const mockUser: AppUser & { password: string } = {
      id: "1",
      email: "test@example.com",
      password: "hashedPassword",
      firstName: "John",
      lastName: "Doe",
      name: "John Doe",
      role: "EMPLOYEE",
      status: "APPROVED",
      isActive: true,
      emailVerified: true,
      createdAt: new Date().toISOString(),
    };

    it("should return success for valid credentials", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        lastLogin: new Date(),
      });

      const result = await authService.validateCredentials(
        "test@example.com",
        "password"
      );

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: "1",
        email: "test@example.com",
        name: "John Doe",
        role: "EMPLOYEE",
        status: "APPROVED",
        emailVerified: true,
      });
    });

    it("should return failure for non-existent user", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await authService.validateCredentials(
        "nonexistent@example.com",
        "password"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("INVALID_CREDENTIALS");
    });

    it("should return failure for invalid password", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.validateCredentials(
        "test@example.com",
        "wrongpassword"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("INVALID_CREDENTIALS");
    });

    it("should return failure for unverified email", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });

      const result = await authService.validateCredentials(
        "test@example.com",
        "password"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("UNVERIFIED_EMAIL");
    });

    it("should return failure for suspended user", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        status: "SUSPENDED",
      });

      const result = await authService.validateCredentials(
        "test@example.com",
        "password"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("ACCOUNT_SUSPENDED");
    });

    it("should return failure for rejected user", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        status: "REJECTED",
      });

      const result = await authService.validateCredentials(
        "test@example.com",
        "password"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("ACCOUNT_REJECTED");
    });

    it("should return failure for pending user", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        status: "PENDING",
      });

      const result = await authService.validateCredentials(
        "test@example.com",
        "password"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("PENDING_VERIFICATION");
    });

    it("should allow login for approved and verified users", async () => {
      const approvedUser = { ...mockUser, status: "APPROVED" };
      const verifiedUser = { ...mockUser, status: "VERIFIED" };

      // Test approved user
      mockPrisma.user.findFirst.mockResolvedValue(approvedUser);
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue({
        ...approvedUser,
        lastLogin: new Date(),
      });

      const approvedResult = await authService.validateCredentials(
        "test@example.com",
        "password"
      );
      expect(approvedResult.success).toBe(true);

      // Test verified user
      mockPrisma.user.findFirst.mockResolvedValue(verifiedUser);
      mockPrisma.user.update.mockResolvedValue({
        ...verifiedUser,
        lastLogin: new Date(),
      });

      const verifiedResult = await authService.validateCredentials(
        "test@example.com",
        "password"
      );
      expect(verifiedResult.success).toBe(true);
    });

    it("should handle account lockout", async () => {
      const { AccountLockout } = require("@/lib/utils/account-lockout");
      AccountLockout.checkLockoutStatus.mockResolvedValue({ isLocked: true });
      AccountLockout.getLockoutMessage.mockReturnValue(
        "Account locked due to too many failed attempts"
      );

      const result = await authService.validateCredentials(
        "test@example.com",
        "password"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("ACCOUNT_LOCKED");
      expect(result.details).toBe(
        "Account locked due to too many failed attempts"
      );
    });

    it("should handle database errors gracefully", async () => {
      mockPrisma.user.findFirst.mockRejectedValue(new Error("Database error"));

      const result = await authService.validateCredentials(
        "test@example.com",
        "password"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("AUTHENTICATION_FAILED");
    });
  });

  describe("updateLastActivity", () => {
    it("should update user last activity", async () => {
      const mockUser = { id: 1, lastActivity: new Date() };
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await authService.updateLastActivity(1);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { lastActivity: expect.any(Date) },
      });
    });

    it("should handle update errors gracefully", async () => {
      mockPrisma.user.update.mockRejectedValue(new Error("Database error"));

      await expect(authService.updateLastActivity(1)).resolves.not.toThrow();
    });
  });

  describe("refreshUserData", () => {
    it("should refresh user data from database", async () => {
      const mockUser = {
        role: "EMPLOYEE",
        status: "APPROVED",
        emailVerified: true,
      };

      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await authService.refreshUserData(1);

      expect(result).toEqual({
        role: "EMPLOYEE",
        status: "APPROVED",
        emailVerified: true,
      });
    });

    it("should return null for non-existent user", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await authService.refreshUserData(999);

      expect(result).toBeNull();
    });

    it("should handle database errors gracefully", async () => {
      mockPrisma.user.findFirst.mockRejectedValue(new Error("Database error"));

      const result = await authService.refreshUserData(1);

      expect(result).toBeNull();
    });
  });

  describe("updateLastLogin", () => {
    it("should update user last login timestamp", async () => {
      const mockUser = { id: 1, lastLogin: new Date() };
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await authService.updateLastLogin(1);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { lastLogin: expect.any(Date) },
      });
    });

    it("should handle update errors gracefully", async () => {
      mockPrisma.user.update.mockRejectedValue(new Error("Database error"));

      await expect(authService.updateLastLogin(1)).resolves.not.toThrow();
    });
  });

  describe("updateLastLogout", () => {
    it("should update user last logout timestamp", async () => {
      const mockUser = { id: 1, lastLogout: new Date() };
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await authService.updateLastLogout(1);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { lastLogout: expect.any(Date) },
      });
    });

    it("should handle update errors gracefully", async () => {
      mockPrisma.user.update.mockRejectedValue(new Error("Database error"));

      await expect(authService.updateLastLogout(1)).resolves.not.toThrow();
    });
  });

  describe("registerUser", () => {
    it("should register a new user successfully", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 2,
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        role: "EMPLOYEE",
        status: "PENDING",
        isActive: true,
        emailVerified: false,
        createdAt: new Date().toISOString(),
      });
      const result = await authService.registerUser({
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        password: "Password123!",
      });
      expect(result.success).toBe(true);
      expect(result.user?.email).toBe("jane@example.com");
      expect(result.requiresVerification).toBe(true);
    });
    it("should fail if email already exists", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 2 });
      const result = await authService.registerUser({
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        password: "Password123!",
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe("User with this email already exists");
    });
  });

  describe("requestPasswordReset", () => {
    it("should always return success for valid email", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        firstName: "John",
        isActive: true,
      });
      const result = await authService.requestPasswordReset("test@example.com");
      expect(result.success).toBe(true);
      expect(result.message).toMatch(/reset link has been sent/);
    });
    it("should always return success for non-existent email", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      const result = await authService.requestPasswordReset("nope@example.com");
      expect(result.success).toBe(true);
    });
  });

  describe("resetPassword", () => {
    it("should reset password for valid token", async () => {
      const token = "validtoken";
      const user = { id: 1, resetToken: "hashed", isActive: true };
      mockPrisma.user.findMany.mockResolvedValue([user]);
      const TokenSecurity = require("@/lib/utils/token-security").TokenSecurity;
      TokenSecurity.verifyToken = jest.fn().mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue({
        ...user,
        password: "hashedNew",
      });
      const result = await authService.resetPassword(token, "NewPassword123!");
      expect(result.success).toBe(true);
      expect(result.message).toMatch(/Password reset successfully/);
    });
    it("should fail for invalid or expired token", async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      const result = await authService.resetPassword(
        "badtoken",
        "NewPassword123!"
      );
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid or expired reset token");
    });
  });

  describe("verifyEmail", () => {
    it("should verify email for valid token", async () => {
      const token = "validtoken";
      const user = {
        id: 1,
        emailVerificationToken: "hashed",
        emailVerificationExpires: new Date(Date.now() + 10000),
        status: "PENDING",
        emailVerified: false,
        firstName: "John",
      };
      mockPrisma.user.findMany.mockResolvedValue([user]);
      const TokenSecurity = require("@/lib/utils/token-security").TokenSecurity;
      TokenSecurity.verifyEmailToken = jest.fn().mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue({
        ...user,
        emailVerified: true,
        status: "VERIFIED",
      });
      const result = await authService.verifyEmail(token);
      expect(result.success).toBe(true);
      expect(result.user?.emailVerified).toBe(true);
      expect(result.user?.status).toBe("VERIFIED");
    });
    it("should fail for invalid or expired token", async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      const result = await authService.verifyEmail("badtoken");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid or expired verification token");
    });
    it("should fail if already verified", async () => {
      const user = {
        id: 1,
        emailVerificationToken: "hashed",
        emailVerificationExpires: new Date(Date.now() + 10000),
        status: "VERIFIED",
        emailVerified: true,
        firstName: "John",
      };
      mockPrisma.user.findMany.mockResolvedValue([user]);
      const TokenSecurity = require("@/lib/utils/token-security").TokenSecurity;
      TokenSecurity.verifyEmailToken = jest.fn().mockResolvedValue(true);
      const result = await authService.verifyEmail("validtoken");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Email is already verified");
    });
  });

  describe("resendVerificationEmail", () => {
    it("should resend verification email for pending user", async () => {
      const user = {
        id: 1,
        firstName: "John",
        email: "test@example.com",
        status: "PENDING",
        emailVerified: false,
      };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue(user);
      const result =
        await authService.resendVerificationEmail("test@example.com");
      expect(result.success).toBe(true);
      expect(result.message).toMatch(/verification email sent/);
    });
    it("should fail if user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result =
        await authService.resendVerificationEmail("nope@example.com");
      expect(result.success).toBe(false);
      expect(result.error).toBe("User not found");
    });
    it("should fail if already verified", async () => {
      const user = {
        id: 1,
        firstName: "John",
        email: "test@example.com",
        status: "VERIFIED",
        emailVerified: true,
      };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      const result =
        await authService.resendVerificationEmail("test@example.com");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Email is already verified");
    });
  });

  describe("refreshUserSession", () => {
    it("should return user data for valid userId", async () => {
      const user = {
        id: 1,
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "EMPLOYEE",
        status: "APPROVED",
        isActive: true,
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      const result = await authService.refreshUserSession(1);
      expect(result.success).toBe(true);
      expect(result.user?.email).toBe("test@example.com");
    });
    it("should fail for non-existent user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await authService.refreshUserSession(999);
      expect(result.success).toBe(false);
      expect(result.error).toBe("User not found");
    });
  });

  describe("validateResetToken", () => {
    it("should return valid for correct token", async () => {
      const token = "validtoken";
      const user = { id: 1, resetToken: "hashed", isActive: true };
      mockPrisma.user.findMany.mockResolvedValue([user]);
      const TokenSecurity = require("@/lib/utils/token-security").TokenSecurity;
      TokenSecurity.verifyToken = jest.fn().mockResolvedValue(true);
      const result = await authService.validateResetToken(token);
      expect(result.valid).toBe(true);
    });
    it("should return invalid for incorrect token", async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      const result = await authService.validateResetToken("badtoken");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid or expired token");
    });
  });
});
