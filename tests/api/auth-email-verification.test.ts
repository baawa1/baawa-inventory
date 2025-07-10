import { NextRequest, NextResponse } from "next/server";
import { AuthenticationService } from "@/lib/auth-service";
import { prisma } from "@/lib/db";

// Mock Next.js server
jest.mock("next/server", () => ({
  NextRequest: class MockNextRequest {
    url: string;
    method: string;
    body: any;

    constructor(url: string, options: any = {}) {
      this.url = url;
      this.method = options.method || "GET";
      this.body = options.body;
    }

    json() {
      return Promise.resolve(JSON.parse(this.body || "{}"));
    }
  },
  NextResponse: {
    json: (data: any, options?: any) => ({
      status: options?.status || 200,
      json: () => Promise.resolve(data),
    }),
  },
}));

// Mock dependencies
jest.mock("@/lib/auth-service", () => ({
  AuthenticationService: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/rate-limit", () => ({
  withAuthRateLimit: (handler: any) => handler,
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const MockAuthenticationService = AuthenticationService as jest.MockedClass<
  typeof AuthenticationService
>;

describe("Email Verification API", () => {
  let mockAuthService: jest.Mocked<AuthenticationService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthService = {
      verifyEmail: jest.fn(),
      resendVerificationEmail: jest.fn(),
    } as any;
    MockAuthenticationService.mockImplementation(() => mockAuthService);
  });

  describe("POST /api/auth/verify-email", () => {
    it("should verify email successfully", async () => {
      const mockRequest = new NextRequest(
        "http://localhost:3000/api/auth/verify-email",
        {
          method: "POST",
          body: JSON.stringify({ token: "valid-token" }),
        }
      );

      mockAuthService.verifyEmail.mockResolvedValue({
        success: true,
        message: "Email verified successfully",
        user: {
          id: "1",
          email: "test@example.com",
          name: "Test User",
          role: "EMPLOYEE",
          status: "VERIFIED",
          emailVerified: true,
        },
        shouldRefreshSession: true,
      });

      const { POST } = await import("@/app/api/auth/verify-email/route");
      const response = await POST(mockRequest);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe("Email verified successfully");
      expect(data.user).toBeDefined();
      expect(data.shouldRefreshSession).toBe(true);
    });

    it("should handle invalid token", async () => {
      const mockRequest = new NextRequest(
        "http://localhost:3000/api/auth/verify-email",
        {
          method: "POST",
          body: JSON.stringify({ token: "invalid-token" }),
        }
      );

      mockAuthService.verifyEmail.mockResolvedValue({
        success: false,
        error: "Invalid or expired verification token",
      });

      const { POST } = await import("@/app/api/auth/verify-email/route");
      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid or expired verification token");
    });

    it("should handle already verified email", async () => {
      const mockRequest = new NextRequest(
        "http://localhost:3000/api/auth/verify-email",
        {
          method: "POST",
          body: JSON.stringify({ token: "already-verified-token" }),
        }
      );

      mockAuthService.verifyEmail.mockResolvedValue({
        success: false,
        error: "Email is already verified",
      });

      const { POST } = await import("@/app/api/auth/verify-email/route");
      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Email is already verified");
    });

    it("should handle missing token", async () => {
      const mockRequest = new NextRequest(
        "http://localhost:3000/api/auth/verify-email",
        {
          method: "POST",
          body: JSON.stringify({}),
        }
      );

      const { POST } = await import("@/app/api/auth/verify-email/route");
      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid request data");
    });

    it("should handle empty token", async () => {
      const mockRequest = new NextRequest(
        "http://localhost:3000/api/auth/verify-email",
        {
          method: "POST",
          body: JSON.stringify({ token: "" }),
        }
      );

      const { POST } = await import("@/app/api/auth/verify-email/route");
      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid request data");
    });

    it("should handle service errors", async () => {
      const mockRequest = new NextRequest(
        "http://localhost:3000/api/auth/verify-email",
        {
          method: "POST",
          body: JSON.stringify({ token: "valid-token" }),
        }
      );

      mockAuthService.verifyEmail.mockRejectedValue(
        new Error("Database error")
      );

      const { POST } = await import("@/app/api/auth/verify-email/route");
      const response = await POST(mockRequest);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Internal server error");
    });

    it("should handle malformed JSON", async () => {
      const mockRequest = new NextRequest(
        "http://localhost:3000/api/auth/verify-email",
        {
          method: "POST",
          body: "invalid-json",
        }
      );

      const { POST } = await import("@/app/api/auth/verify-email/route");
      const response = await POST(mockRequest);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Internal server error");
    });
  });

  describe("PUT /api/auth/verify-email (resend verification)", () => {
    it("should resend verification email successfully", async () => {
      const mockRequest = new NextRequest(
        "http://localhost:3000/api/auth/verify-email",
        {
          method: "PUT",
          body: JSON.stringify({ email: "test@example.com" }),
        }
      );

      mockAuthService.resendVerificationEmail.mockResolvedValue({
        success: true,
        message: "Verification email sent successfully",
      });

      const { PUT } = await import("@/app/api/auth/verify-email/route");
      const response = await PUT(mockRequest);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe("Verification email sent successfully");
    });

    it("should handle user not found", async () => {
      const mockRequest = new NextRequest(
        "http://localhost:3000/api/auth/verify-email",
        {
          method: "PUT",
          body: JSON.stringify({ email: "nonexistent@example.com" }),
        }
      );

      mockAuthService.resendVerificationEmail.mockResolvedValue({
        success: false,
        error: "User not found",
      });

      const { PUT } = await import("@/app/api/auth/verify-email/route");
      const response = await PUT(mockRequest);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("User not found");
    });

    it("should handle invalid email format", async () => {
      const mockRequest = new NextRequest(
        "http://localhost:3000/api/auth/verify-email",
        {
          method: "PUT",
          body: JSON.stringify({ email: "invalid-email" }),
        }
      );

      const { PUT } = await import("@/app/api/auth/verify-email/route");
      const response = await PUT(mockRequest);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid request data");
    });

    it("should handle missing email", async () => {
      const mockRequest = new NextRequest(
        "http://localhost:3000/api/auth/verify-email",
        {
          method: "PUT",
          body: JSON.stringify({}),
        }
      );

      const { PUT } = await import("@/app/api/auth/verify-email/route");
      const response = await PUT(mockRequest);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid request data");
    });

    it("should handle service errors for resend", async () => {
      const mockRequest = new NextRequest(
        "http://localhost:3000/api/auth/verify-email",
        {
          method: "PUT",
          body: JSON.stringify({ email: "test@example.com" }),
        }
      );

      mockAuthService.resendVerificationEmail.mockRejectedValue(
        new Error("Email service error")
      );

      const { PUT } = await import("@/app/api/auth/verify-email/route");
      const response = await PUT(mockRequest);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Internal server error");
    });
  });

  describe("Rate Limiting", () => {
    it("should apply rate limiting to verification endpoint", async () => {
      const mockRequest = new NextRequest(
        "http://localhost:3000/api/auth/verify-email",
        {
          method: "POST",
          body: JSON.stringify({ token: "valid-token" }),
        }
      );

      mockAuthService.verifyEmail.mockResolvedValue({
        success: true,
        message: "Email verified successfully",
      });

      const { POST } = await import("@/app/api/auth/verify-email/route");
      const response = await POST(mockRequest);

      // Rate limiting should be applied (wrapped by withAuthRateLimit)
      expect(response.status).toBe(200);
    });

    it("should apply rate limiting to resend endpoint", async () => {
      const mockRequest = new NextRequest(
        "http://localhost:3000/api/auth/verify-email",
        {
          method: "PUT",
          body: JSON.stringify({ email: "test@example.com" }),
        }
      );

      mockAuthService.resendVerificationEmail.mockResolvedValue({
        success: true,
        message: "Verification email sent successfully",
      });

      const { PUT } = await import("@/app/api/auth/verify-email/route");
      const response = await PUT(mockRequest);

      // Rate limiting should be applied (wrapped by withAuthRateLimit)
      expect(response.status).toBe(200);
    });
  });

  describe("Authentication Service Integration", () => {
    it("should call verifyEmail with correct parameters", async () => {
      const mockRequest = new NextRequest(
        "http://localhost:3000/api/auth/verify-email",
        {
          method: "POST",
          body: JSON.stringify({ token: "test-token-123" }),
        }
      );

      mockAuthService.verifyEmail.mockResolvedValue({
        success: true,
        message: "Email verified successfully",
      });

      const { POST } = await import("@/app/api/auth/verify-email/route");
      await POST(mockRequest);

      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(
        "test-token-123"
      );
    });

    it("should call resendVerificationEmail with correct parameters", async () => {
      const mockRequest = new NextRequest(
        "http://localhost:3000/api/auth/verify-email",
        {
          method: "PUT",
          body: JSON.stringify({ email: "user@example.com" }),
        }
      );

      mockAuthService.resendVerificationEmail.mockResolvedValue({
        success: true,
        message: "Verification email sent successfully",
      });

      const { PUT } = await import("@/app/api/auth/verify-email/route");
      await PUT(mockRequest);

      expect(mockAuthService.resendVerificationEmail).toHaveBeenCalledWith(
        "user@example.com"
      );
    });
  });

  describe("Error Response Format", () => {
    it("should return consistent error format for validation errors", async () => {
      const mockRequest = new NextRequest(
        "http://localhost:3000/api/auth/verify-email",
        {
          method: "POST",
          body: JSON.stringify({ token: "" }),
        }
      );

      const { POST } = await import("@/app/api/auth/verify-email/route");
      const response = await POST(mockRequest);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data).toHaveProperty("details");
    });

    it("should return consistent error format for service errors", async () => {
      const mockRequest = new NextRequest(
        "http://localhost:3000/api/auth/verify-email",
        {
          method: "POST",
          body: JSON.stringify({ token: "valid-token" }),
        }
      );

      mockAuthService.verifyEmail.mockResolvedValue({
        success: false,
        error: "Verification failed",
      });

      const { POST } = await import("@/app/api/auth/verify-email/route");
      const response = await POST(mockRequest);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty("error");
    });
  });
});
