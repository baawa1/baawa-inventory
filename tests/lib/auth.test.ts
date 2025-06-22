import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import bcrypt from "bcryptjs";

// Mock NextAuth for testing
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/supabase", () => ({
  createServerSupabaseClient: jest.fn(),
}));

describe("Authentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("authOptions", () => {
    test("should have correct configuration", () => {
      expect(authOptions.session?.strategy).toBe("jwt");
      expect(authOptions.pages?.signIn).toBe("/auth/signin");
      expect(authOptions.pages?.error).toBe("/auth/error");
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
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error("User not found") }),
      };

      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);

      const provider = authOptions.providers[0] as any;
      const result = await provider.authorize({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(result).toBeNull();
    });

    test("should return null for inactive user", async () => {
      // Mock that the query returns no user for inactive users
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error("User not found") }),
      };

      (createServerSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);

      const provider = authOptions.providers[0] as any;
      const result = await provider.authorize({
        email: "inactive@example.com",
        password: "password123",
      });

      expect(result).toBeNull();
    });

    test("should have valid provider configuration", async () => {
      const provider = authOptions.providers[0] as any;
      
      // Test that the provider has the expected structure
      expect(typeof provider.authorize).toBe("function");
      expect(provider.name).toBe("Credentials");
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
        user: mockUser 
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
