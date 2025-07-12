import { createMocks } from "node-mocks-http";
import { POST } from "@/app/api/auth/reset-password/route";

// Mock dependencies
const mockFindFirst = jest.fn();
const mockUpdate = jest.fn();
const mockHash = jest.fn();
const mockSendPasswordResetEmail = jest.fn();
const mockLogAuthEvent = jest.fn();
const mockLogPasswordResetSuccess = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findFirst: mockFindFirst,
      update: mockUpdate,
    },
  },
}));

jest.mock("@/lib/email/service", () => ({
  emailService: {
    sendPasswordResetEmail: mockSendPasswordResetEmail,
  },
}));

jest.mock("@/lib/utils/audit-logger", () => ({
  AuditLogger: {
    logAuthEvent: mockLogAuthEvent,
    logPasswordResetSuccess: mockLogPasswordResetSuccess,
  },
}));

jest.mock("@/lib/rate-limiting", () => ({
  withRateLimit: jest.fn((handler) => handler),
}));

jest.mock("bcryptjs", () => ({
  hash: mockHash,
}));

describe("POST /api/auth/reset-password - Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Input Validation", () => {
    it("returns 400 for missing token", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          password: "StrongPass123!",
          confirmPassword: "StrongPass123!",
        },
      });

      await POST(req);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe("Invalid input data");
      expect(data.details).toContainEqual(
        expect.objectContaining({
          message: "Reset token is required",
        })
      );
    });

    it("returns 400 for missing password", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "valid-token",
          confirmPassword: "StrongPass123!",
        },
      });

      await POST(req);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe("Invalid input data");
    });

    it("returns 400 for invalid password format", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "valid-token",
          password: "weak",
          confirmPassword: "weak",
        },
      });

      await POST(req);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe("Invalid input data");
    });

    it("returns 400 for password mismatch", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "valid-token",
          password: "StrongPass123!",
          confirmPassword: "DifferentPass123!",
        },
      });

      await POST(req);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe("Invalid input data");
      expect(data.details).toContainEqual(
        expect.objectContaining({
          message: "Passwords don't match",
        })
      );
    });
  });

  describe("Token Validation", () => {
    it("returns 400 for invalid token", async () => {
      mockFindFirst.mockResolvedValue(null);

      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "invalid-token",
          password: "StrongPass123!",
          confirmPassword: "StrongPass123!",
        },
      });

      await POST(req);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe("Invalid or expired reset token");
      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          resetToken: "invalid-token",
          resetTokenExpires: {
            gt: expect.any(Date),
          },
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          userStatus: true,
          emailVerified: true,
        },
      });
    });

    it("returns 403 for unverified user", async () => {
      mockFindFirst.mockResolvedValue({
        id: "user-id",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        userStatus: "PENDING",
        emailVerified: false,
      });

      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "valid-token",
          password: "StrongPass123!",
          confirmPassword: "StrongPass123!",
        },
      });

      await POST(req);

      expect(res._getStatusCode()).toBe(403);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe("Account is not eligible for password reset");
    });

    it("returns 403 for non-approved user", async () => {
      mockFindFirst.mockResolvedValue({
        id: "user-id",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        userStatus: "SUSPENDED",
        emailVerified: true,
      });

      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "valid-token",
          password: "StrongPass123!",
          confirmPassword: "StrongPass123!",
        },
      });

      await POST(req);

      expect(res._getStatusCode()).toBe(403);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe("Account is not eligible for password reset");
    });
  });

  describe("Password Reset Success", () => {
    it("successfully resets password with valid token", async () => {
      const mockUser = {
        id: "user-id",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        userStatus: "APPROVED",
        emailVerified: true,
      };

      mockFindFirst.mockResolvedValue(mockUser);
      mockUpdate.mockResolvedValue(mockUser);
      mockHash.mockResolvedValue("hashed-password");
      mockSendPasswordResetEmail.mockResolvedValue(undefined);
      mockLogPasswordResetSuccess.mockResolvedValue(undefined);

      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "valid-token",
          password: "StrongPass123!",
          confirmPassword: "StrongPass123!",
        },
      });

      await POST(req);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.message).toBe(
        "Password reset successful! You can now login with your new password."
      );
      expect(data.success).toBe(true);

      // Verify password was hashed
      expect(mockHash).toHaveBeenCalledWith("StrongPass123!", 12);

      // Verify user was updated
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "user-id" },
        data: {
          password: "hashed-password",
          resetToken: null,
          resetTokenExpires: null,
          lastActivity: expect.any(Date),
        },
      });

      // Verify audit log was created
      expect(mockLogPasswordResetSuccess).toHaveBeenCalledWith(
        "user-id",
        "test@example.com",
        req
      );

      // Verify email was sent
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        "test@example.com",
        {
          firstName: "Test",
          resetLink: expect.stringContaining("/login"),
          expiresInHours: 0,
        }
      );
    });
  });

  describe("Error Handling", () => {
    it("returns 500 for database errors", async () => {
      mockFindFirst.mockRejectedValue(new Error("Database connection failed"));

      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "valid-token",
          password: "StrongPass123!",
          confirmPassword: "StrongPass123!",
        },
      });

      await POST(req);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe("Failed to reset password. Please try again.");
    });

    it("returns 500 for password hashing errors", async () => {
      const mockUser = {
        id: "user-id",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        userStatus: "APPROVED",
        emailVerified: true,
      };

      mockFindFirst.mockResolvedValue(mockUser);
      mockHash.mockRejectedValue(new Error("Hashing failed"));

      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "valid-token",
          password: "StrongPass123!",
          confirmPassword: "StrongPass123!",
        },
      });

      await POST(req);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe("Failed to reset password. Please try again.");
    });
  });

  describe("Security", () => {
    it("clears reset token after successful password reset", async () => {
      const mockUser = {
        id: "user-id",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        userStatus: "APPROVED",
        emailVerified: true,
      };

      mockFindFirst.mockResolvedValue(mockUser);
      mockUpdate.mockResolvedValue(mockUser);
      mockHash.mockResolvedValue("hashed-password");
      mockSendPasswordResetEmail.mockResolvedValue(undefined);
      mockLogPasswordResetSuccess.mockResolvedValue(undefined);

      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "valid-token",
          password: "StrongPass123!",
          confirmPassword: "StrongPass123!",
        },
      });

      await POST(req);

      // Verify reset token is cleared
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "user-id" },
        data: {
          password: "hashed-password",
          resetToken: null,
          resetTokenExpires: null,
          lastActivity: expect.any(Date),
        },
      });
    });

    it("logs failed attempts", async () => {
      mockFindFirst.mockResolvedValue(null);
      mockLogAuthEvent.mockResolvedValue(undefined);

      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "invalid-token",
          password: "StrongPass123!",
          confirmPassword: "StrongPass123!",
        },
      });

      await POST(req);

      // Verify audit log was created for failed attempt
      expect(mockLogAuthEvent).toHaveBeenCalledWith(
        {
          action: "PASSWORD_RESET_SUCCESS",
          success: false,
          errorMessage: "Invalid or expired reset token",
          details: { token: "invalid-t..." },
        },
        req
      );
    });
  });
});
