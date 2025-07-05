import { authService } from "@/lib/auth-service";
import * as bcrypt from "bcryptjs";

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
    const mockUser = {
      id: 1,
      email: "test@example.com",
      password: "hashedPassword",
      firstName: "John",
      lastName: "Doe",
      role: "EMPLOYEE",
      userStatus: "APPROVED",
      isActive: true,
      emailVerified: true,
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
        userStatus: "SUSPENDED",
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
        userStatus: "REJECTED",
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
        userStatus: "PENDING",
      });

      const result = await authService.validateCredentials(
        "test@example.com",
        "password"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("PENDING_VERIFICATION");
    });

    it("should allow login for approved and verified users", async () => {
      const approvedUser = { ...mockUser, userStatus: "APPROVED" };
      const verifiedUser = { ...mockUser, userStatus: "VERIFIED" };

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
        userStatus: "APPROVED",
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
});
