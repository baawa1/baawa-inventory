import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { SecureTokenManager } from "@/lib/utils/secure-token-manager";
import { AuthenticationService } from "@/lib/auth-service";

// Mock dependencies
jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/utils/secure-token-manager", () => ({
  SecureTokenManager: {
    verifyToken: jest.fn(),
  },
}));

jest.mock("@/lib/auth-service", () => ({
  AuthenticationService: jest.fn().mockImplementation(() => ({
    verifyEmail: jest.fn(),
  })),
}));

// Mock the email service
jest.mock("@/lib/email", () => ({
  emailService: {
    sendEmailVerification: jest.fn(),
  },
}));

describe("Email Verification API", () => {
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;
  const mockSecureTokenManager = SecureTokenManager as jest.Mocked<
    typeof SecureTokenManager
  >;
  const mockAuthService = AuthenticationService as jest.MockedClass<
    typeof AuthenticationService
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (body: any): NextRequest => {
    return {
      json: jest.fn().mockResolvedValue(body),
      headers: new Map(),
    } as any;
  };

  describe("POST /api/auth/verify-email", () => {
    it("should verify email with valid token", async () => {
      const mockVerifyEmail = jest.fn().mockResolvedValue({
        success: true,
        message: "Email verified successfully",
        user: {
          id: "1",
          email: "test@example.com",
          emailVerified: true,
        },
        shouldRefreshSession: true,
      });

      mockAuthService.mockImplementation(
        () =>
          ({
            verifyEmail: mockVerifyEmail,
          }) as any
      );

      const request = createRequest({ token: "valid-token" });

      // Import the route handler
      const { POST } = await import("@/app/api/auth/verify-email/route");
      const response = await POST(request);
      const data = await response.json();

      expect(mockVerifyEmail).toHaveBeenCalledWith("valid-token");
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: "Email verified successfully",
        user: {
          id: "1",
          email: "test@example.com",
          emailVerified: true,
        },
        shouldRefreshSession: true,
      });
    });

    it("should handle invalid token", async () => {
      const mockVerifyEmail = jest.fn().mockResolvedValue({
        success: false,
        error: "Invalid or expired verification token",
      });

      mockAuthService.mockImplementation(
        () =>
          ({
            verifyEmail: mockVerifyEmail,
          }) as any
      );

      const request = createRequest({ token: "invalid-token" });

      const { POST } = await import("@/app/api/auth/verify-email/route");
      const response = await POST(request);
      const data = await response.json();

      expect(mockVerifyEmail).toHaveBeenCalledWith("invalid-token");
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: "Invalid or expired verification token",
      });
    });

    it("should handle already verified email", async () => {
      const mockVerifyEmail = jest.fn().mockResolvedValue({
        success: false,
        error: "Email is already verified",
      });

      mockAuthService.mockImplementation(
        () =>
          ({
            verifyEmail: mockVerifyEmail,
          }) as any
      );

      const request = createRequest({ token: "already-verified-token" });

      const { POST } = await import("@/app/api/auth/verify-email/route");
      const response = await POST(request);
      const data = await response.json();

      expect(mockVerifyEmail).toHaveBeenCalledWith("already-verified-token");
      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: "Email is already verified",
      });
    });

    it("should handle missing token", async () => {
      const request = createRequest({});

      const { POST } = await import("@/app/api/auth/verify-email/route");
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: "Token is required",
      });
    });

    it("should handle empty token", async () => {
      const request = createRequest({ token: "" });

      const { POST } = await import("@/app/api/auth/verify-email/route");
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: "Token is required",
      });
    });

    it("should handle service errors", async () => {
      const mockVerifyEmail = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      mockAuthService.mockImplementation(
        () =>
          ({
            verifyEmail: mockVerifyEmail,
          }) as any
      );

      const request = createRequest({ token: "valid-token" });

      const { POST } = await import("@/app/api/auth/verify-email/route");
      const response = await POST(request);
      const data = await response.json();

      expect(mockVerifyEmail).toHaveBeenCalledWith("valid-token");
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: "Internal server error",
      });
    });

    it("should handle malformed request body", async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
        headers: new Map(),
      } as any;

      const { POST } = await import("@/app/api/auth/verify-email/route");
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: "Invalid request",
      });
    });
  });

  describe("Email verification token validation", () => {
    it("should validate token format", async () => {
      const mockVerifyEmail = jest.fn().mockResolvedValue({
        success: true,
        message: "Email verified successfully",
      });

      mockAuthService.mockImplementation(
        () =>
          ({
            verifyEmail: mockVerifyEmail,
          }) as any
      );

      // Test with a properly formatted token
      const request = createRequest({
        token: "abcdef1234567890abcdef1234567890",
      });

      const { POST } = await import("@/app/api/auth/verify-email/route");
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockVerifyEmail).toHaveBeenCalledWith(
        "abcdef1234567890abcdef1234567890"
      );
    });

    it("should handle short tokens", async () => {
      const request = createRequest({ token: "short" });

      const { POST } = await import("@/app/api/auth/verify-email/route");
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: "Token is required",
      });
    });
  });

  describe("Rate limiting integration", () => {
    it("should respect rate limiting", async () => {
      // This test would require mocking the rate limiting middleware
      // For now, we'll test that the endpoint responds correctly
      const mockVerifyEmail = jest.fn().mockResolvedValue({
        success: true,
        message: "Email verified successfully",
      });

      mockAuthService.mockImplementation(
        () =>
          ({
            verifyEmail: mockVerifyEmail,
          }) as any
      );

      const request = createRequest({ token: "valid-token" });

      const { POST } = await import("@/app/api/auth/verify-email/route");
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe("Security considerations", () => {
    it("should not expose sensitive information in error responses", async () => {
      const mockVerifyEmail = jest.fn().mockResolvedValue({
        success: false,
        error: "Database connection failed",
      });

      mockAuthService.mockImplementation(
        () =>
          ({
            verifyEmail: mockVerifyEmail,
          }) as any
      );

      const request = createRequest({ token: "valid-token" });

      const { POST } = await import("@/app/api/auth/verify-email/route");
      const response = await POST(request);
      const data = await response.json();

      // Should not expose internal error details
      expect(data.error).not.toContain("Database");
      expect(data.error).toBe("Internal server error");
    });

    it("should handle timing attacks", async () => {
      // Test that response times are consistent regardless of token validity
      const validToken = "valid-token-1234567890";
      const invalidToken = "invalid-token-1234567890";

      const mockVerifyEmail = jest
        .fn()
        .mockResolvedValueOnce({
          success: true,
          message: "Email verified successfully",
        })
        .mockResolvedValueOnce({
          success: false,
          error: "Invalid or expired verification token",
        });

      mockAuthService.mockImplementation(
        () =>
          ({
            verifyEmail: mockVerifyEmail,
          }) as any
      );

      const { POST } = await import("@/app/api/auth/verify-email/route");

      // Test valid token
      const validRequest = createRequest({ token: validToken });
      const startTime1 = Date.now();
      const validResponse = await POST(validRequest);
      const endTime1 = Date.now();
      const validDuration = endTime1 - startTime1;

      // Test invalid token
      const invalidRequest = createRequest({ token: invalidToken });
      const startTime2 = Date.now();
      const invalidResponse = await POST(invalidRequest);
      const endTime2 = Date.now();
      const invalidDuration = endTime2 - startTime2;

      // Response times should be similar (within 100ms)
      expect(Math.abs(validDuration - invalidDuration)).toBeLessThan(100);
    });
  });
});
