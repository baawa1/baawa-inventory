import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-auth-middleware";
import { hasPermission } from "@/lib/auth/roles";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";

// Mock Next.js server
jest.mock("next/server", () => ({
  NextRequest: class MockNextRequest {
    url: string;
    headers: Headers;
    method: string;

    constructor(url: string, options: any = {}) {
      this.url = url;
      this.headers = new Headers(options.headers || {});
      this.method = options.method || "GET";
    }
  },
  NextResponse: {
    json: jest.fn().mockReturnValue({
      status: 200,
      json: jest.fn(),
    }),
  },
}));

// Mock dependencies
jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth/roles", () => ({
  hasPermission: jest.fn(),
}));

jest.mock("@/lib/auth-config", () => ({
  authOptions: {},
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;
const mockHasPermission = hasPermission as jest.MockedFunction<
  typeof hasPermission
>;

describe("Authentication Middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("withAuth middleware", () => {
    const mockHandler = jest.fn();
    const mockRequest = {
      url: "http://localhost:3000/api/test",
      headers: new Headers(),
      method: "GET",
    } as NextRequest;

    it("should allow access with valid session", async () => {
      const mockSession = {
        user: {
          id: "1",
          email: "test@example.com",
          role: "ADMIN",
          status: "APPROVED",
          emailVerified: true,
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));

      const wrappedHandler = withAuth(mockHandler);
      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockSession.user,
        }),
        mockRequest
      );
    });

    it("should reject request without session", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const wrappedHandler = withAuth(mockHandler);
      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({
        error: "Unauthorized access",
      });
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should reject request with incomplete user data", async () => {
      const mockSession = {
        user: {
          id: "1",
          email: "test@example.com",
          // Missing role and status
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const wrappedHandler = withAuth(mockHandler);
      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "Incomplete user session data",
      });
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should require email verification when specified", async () => {
      const mockSession = {
        user: {
          id: "1",
          email: "test@example.com",
          role: "ADMIN",
          status: "APPROVED",
          emailVerified: false,
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const wrappedHandler = withAuth(mockHandler, {
        requireEmailVerified: true,
      });
      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: "Email verification required",
      });
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should check authorization permissions", async () => {
      const mockSession = {
        user: {
          id: "1",
          email: "test@example.com",
          role: "EMPLOYEE",
          status: "APPROVED",
          emailVerified: true,
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockHasPermission.mockReturnValue(false);

      const wrappedHandler = withAuth(mockHandler, {
        permission: "USER_MANAGEMENT",
      });
      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: "Forbidden access",
      });
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should check specific roles", async () => {
      const mockSession = {
        user: {
          id: "1",
          email: "test@example.com",
          role: "EMPLOYEE",
          status: "APPROVED",
          emailVerified: true,
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const wrappedHandler = withAuth(mockHandler, {
        roles: ["ADMIN", "MANAGER"],
      });
      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: "Forbidden access",
      });
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should allow access with correct role", async () => {
      const mockSession = {
        user: {
          id: "1",
          email: "test@example.com",
          role: "ADMIN",
          status: "APPROVED",
          emailVerified: true,
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));

      const wrappedHandler = withAuth(mockHandler, {
        roles: ["ADMIN", "MANAGER"],
      });
      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
    });

    it("should handle authorization success", async () => {
      const mockSession = {
        user: {
          id: "1",
          email: "test@example.com",
          role: "ADMIN",
          status: "APPROVED",
          emailVerified: true,
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockHasPermission.mockReturnValue(true);
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));

      const wrappedHandler = withAuth(mockHandler, {
        permission: "USER_MANAGEMENT",
      });
      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
    });

    it("should handle middleware errors gracefully", async () => {
      mockGetServerSession.mockRejectedValue(new Error("Session error"));

      const wrappedHandler = withAuth(mockHandler);
      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        error: "Internal server error",
      });
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe("Route Protection", () => {
    it("should protect API routes requiring authentication", async () => {
      const mockRequest = {
        url: "http://localhost:3000/api/protected",
        headers: new Headers(),
        method: "GET",
      } as NextRequest;

      mockGetServerSession.mockResolvedValue(null);

      const protectedHandler = withAuth(async () =>
        NextResponse.json({ data: "protected" })
      );
      const response = await protectedHandler(mockRequest);

      expect(response.status).toBe(401);
    });

    it("should allow access to protected routes with valid session", async () => {
      const mockRequest = {
        url: "http://localhost:3000/api/protected",
        headers: new Headers(),
        method: "GET",
      } as NextRequest;

      const mockSession = {
        user: {
          id: "1",
          email: "test@example.com",
          role: "ADMIN",
          status: "APPROVED",
          emailVerified: true,
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const protectedHandler = withAuth(async () =>
        NextResponse.json({ data: "protected" })
      );
      const response = await protectedHandler(mockRequest);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ data: "protected" });
    });
  });

  describe("User Status Validation", () => {
    it("should reject users with PENDING status", async () => {
      const mockSession = {
        user: {
          id: "1",
          email: "test@example.com",
          role: "EMPLOYEE",
          status: "PENDING",
          emailVerified: true,
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const wrappedHandler = withAuth(async () =>
        NextResponse.json({ success: true })
      );
      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(403);
    });

    it("should reject users with SUSPENDED status", async () => {
      const mockSession = {
        user: {
          id: "1",
          email: "test@example.com",
          role: "EMPLOYEE",
          status: "SUSPENDED",
          emailVerified: true,
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const wrappedHandler = withAuth(async () =>
        NextResponse.json({ success: true })
      );
      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(403);
    });

    it("should allow users with APPROVED status", async () => {
      const mockSession = {
        user: {
          id: "1",
          email: "test@example.com",
          role: "EMPLOYEE",
          status: "APPROVED",
          emailVerified: true,
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession);

      const wrappedHandler = withAuth(async () =>
        NextResponse.json({ success: true })
      );
      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(200);
    });
  });

  describe("Session Validation", () => {
    it("should validate session structure", async () => {
      const invalidSession = {
        user: {
          id: "1",
          // Missing required fields
        },
      };

      mockGetServerSession.mockResolvedValue(invalidSession);

      const wrappedHandler = withAuth(async () =>
        NextResponse.json({ success: true })
      );
      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: "Incomplete user session data",
      });
    });

    it("should handle malformed session data", async () => {
      const malformedSession = {
        user: null,
      };

      mockGetServerSession.mockResolvedValue(malformedSession);

      const wrappedHandler = withAuth(async () =>
        NextResponse.json({ success: true })
      );
      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(400);
    });
  });

  describe("Error Handling", () => {
    it("should handle session retrieval errors", async () => {
      mockGetServerSession.mockRejectedValue(
        new Error("Database connection failed")
      );

      const wrappedHandler = withAuth(async () =>
        NextResponse.json({ success: true })
      );
      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        error: "Internal server error",
      });
    });

    it("should handle authorization validation errors", async () => {
      const mockSession = {
        user: {
          id: "1",
          email: "test@example.com",
          role: "ADMIN",
          status: "APPROVED",
          emailVerified: true,
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockHasPermission.mockImplementation(() => {
        throw new Error("Authorization validation failed");
      });

      const wrappedHandler = withAuth(
        async () => NextResponse.json({ success: true }),
        {
          permission: "USER_MANAGEMENT",
        }
      );
      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(500);
    });
  });
});
