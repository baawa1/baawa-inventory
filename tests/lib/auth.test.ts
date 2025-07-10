import { authOptions } from "@/lib/auth";
import { authService } from "@/lib/auth-service";

// Mock dependencies
jest.mock("@/lib/auth-service", () => ({
  authService: {
    validateCredentials: jest.fn(),
    refreshUserData: jest.fn(),
    updateLastLogout: jest.fn(),
  },
}));

jest.mock("@/lib/utils/audit-logger", () => ({
  AuditLogger: {
    logSessionExpired: jest.fn(),
  },
}));

jest.mock("@/lib/session-blacklist", () => ({
  SessionBlacklist: {
    isSessionBlacklisted: jest.fn(),
    blacklistSession: jest.fn(),
  },
}));

describe("Authentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("authOptions", () => {
    test("should have correct configuration", () => {
      expect(authOptions.session?.strategy).toBe("jwt");
      expect(authOptions.pages?.signIn).toBe("/login");
      expect(authOptions.pages?.error).toBe("/login");
      expect(authOptions.providers).toHaveLength(1);
      expect(authOptions.providers[0].name).toBe("Credentials");
    });
  });

  describe("credentials provider", () => {
    test("should return null for missing credentials", async () => {
      const provider = authOptions.providers[0] as any;

      const result1 = await provider.authorize({});
      expect(result1).toBeNull();

      const result2 = await provider.authorize({ email: "test@example.com" });
      expect(result2).toBeNull();

      const result3 = await provider.authorize({ password: "password" });
      expect(result3).toBeNull();
    });

    test("should return null for non-existent user", async () => {
      (authService.validateCredentials as jest.Mock).mockResolvedValue({
        success: false,
        error: "INVALID_CREDENTIALS",
      });

      const provider = authOptions.providers[0] as any;
      const result = await provider.authorize({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(result).toBeNull();
    });

    test("should return null for inactive user", async () => {
      (authService.validateCredentials as jest.Mock).mockResolvedValue({
        success: false,
        error: "ACCOUNT_INACTIVE",
      });

      const provider = authOptions.providers[0] as any;
      const result = await provider.authorize({
        email: "inactive@example.com",
        password: "password123",
      });

      expect(result).toBeNull();
    });

    test("should return user for valid credentials", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        role: "EMPLOYEE",
        status: "APPROVED",
        emailVerified: true,
      };

      (authService.validateCredentials as jest.Mock).mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const provider = authOptions.providers[0] as any;
      const result = await provider.authorize({
        email: "test@example.com",
        password: "password123",
      });

      expect(result).toEqual(mockUser);
    });

    test("should have valid provider configuration", async () => {
      const provider = authOptions.providers[0] as any;

      // Test that the provider has the expected structure
      expect(typeof provider.authorize).toBe("function");
      expect(provider.name).toBe("credentials");
      expect(provider.type).toBe("credentials");

      // Verify it's a proper credentials provider configuration
      expect(provider).toHaveProperty("authorize");
    });
  });

  describe("callbacks", () => {
    test("jwt callback should add role to token", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        role: "EMPLOYEE",
      };

      const mockToken = { sub: "1" };

      const result = await authOptions.callbacks!.jwt!({
        token: mockToken,
        user: mockUser,
      } as any);

      expect(result.role).toBe("EMPLOYEE");
    });

    test("session callback should add user data to session", async () => {
      const mockSession = {
        user: {
          email: "test@example.com",
          name: "Test User",
        },
      };

      const mockToken = {
        sub: "1",
        role: "EMPLOYEE",
      };

      const result = await authOptions.callbacks!.session!({
        session: mockSession,
        token: mockToken,
      } as any);

      expect((result.user as any)?.id).toBe("1");
      expect((result.user as any)?.role).toBe("EMPLOYEE");
    });
  });
});
