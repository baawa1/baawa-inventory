import { getRolePermissions, UserRole } from "@/lib/auth-rbac";
import {
  requireRole,
  requirePermission,
  hasRole,
  hasPermission,
} from "@/lib/auth-helpers";
import { getServerSession } from "next-auth/next";

// Mock NextAuth
jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;

describe("Role-Based Authentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Role Permissions", () => {
    test("should return correct permissions for ADMIN role", () => {
      const permissions = getRolePermissions("ADMIN");

      expect(permissions.canAccessAdmin).toBe(true);
      expect(permissions.canAccessReports).toBe(true);
      expect(permissions.canAccessSettings).toBe(true);
      expect(permissions.canManageUsers).toBe(true);
      expect(permissions.canManageSuppliers).toBe(true);
      expect(permissions.canDeleteTransactions).toBe(true);
      expect(permissions.canViewAllSales).toBe(true);
      expect(permissions.canProcessRefunds).toBe(true);
    });

    test("should return correct permissions for MANAGER role", () => {
      const permissions = getRolePermissions("MANAGER");

      expect(permissions.canAccessAdmin).toBe(false);
      expect(permissions.canAccessReports).toBe(true);
      expect(permissions.canAccessSettings).toBe(true);
      expect(permissions.canManageUsers).toBe(false);
      expect(permissions.canManageSuppliers).toBe(true);
      expect(permissions.canDeleteTransactions).toBe(true);
      expect(permissions.canViewAllSales).toBe(true);
      expect(permissions.canProcessRefunds).toBe(true);
    });

    test("should return correct permissions for EMPLOYEE role", () => {
      const permissions = getRolePermissions("EMPLOYEE");

      expect(permissions.canAccessAdmin).toBe(false);
      expect(permissions.canAccessReports).toBe(false);
      expect(permissions.canAccessSettings).toBe(false);
      expect(permissions.canManageUsers).toBe(false);
      expect(permissions.canManageSuppliers).toBe(false);
      expect(permissions.canDeleteTransactions).toBe(false);
      expect(permissions.canViewAllSales).toBe(false);
      expect(permissions.canProcessRefunds).toBe(false);
    });
  });

  describe("Server-side Role Checking", () => {
    test("should allow access for matching role", async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "1",
          email: "manager@baawa.com",
          name: "Manager User",
          role: "MANAGER",
        },
      } as any);

      const user = await requireRole("MANAGER");
      expect(user.role).toBe("MANAGER");
    });

    test("should allow admin access to any role requirement", async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "1",
          email: "admin@baawa.com",
          name: "Admin User",
          role: "ADMIN",
        },
      } as any);

      const user = await requireRole("EMPLOYEE");
      expect(user.role).toBe("ADMIN");
    });

    test("should reject access for insufficient role", async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "1",
          email: "employee@baawa.com",
          name: "Employee User",
          role: "EMPLOYEE",
        },
      } as any);

      await expect(requireRole("MANAGER")).rejects.toThrow(
        "Role MANAGER required"
      );
    });

    test("should handle multiple allowed roles", async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "1",
          email: "manager@baawa.com",
          name: "Manager User",
          role: "MANAGER",
        },
      } as any);

      const user = await requireRole(["ADMIN", "MANAGER"]);
      expect(user.role).toBe("MANAGER");
    });
  });

  describe("Permission-based Access Control", () => {
    test("should allow access for valid permission", async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "1",
          email: "manager@baawa.com",
          name: "Manager User",
          role: "MANAGER",
        },
      } as any);

      const user = await requirePermission("canAccessReports");
      expect(user.role).toBe("MANAGER");
    });

    test("should reject access for invalid permission", async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "1",
          email: "employee@baawa.com",
          name: "Employee User",
          role: "EMPLOYEE",
        },
      } as any);

      await expect(requirePermission("canAccessReports")).rejects.toThrow(
        "Permission canAccessReports required"
      );
    });

    test("should allow admin access to any permission", async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "1",
          email: "admin@baawa.com",
          name: "Admin User",
          role: "ADMIN",
        },
      } as any);

      const user = await requirePermission("canManageUsers");
      expect(user.role).toBe("ADMIN");
    });
  });

  describe("Role and Permission Checking Utilities", () => {
    test("hasRole should return true for matching role", async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "1",
          email: "manager@baawa.com",
          name: "Manager User",
          role: "MANAGER",
        },
      } as any);

      const result = await hasRole("MANAGER");
      expect(result).toBe(true);
    });

    test("hasRole should return true for admin checking any role", async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "1",
          email: "admin@baawa.com",
          name: "Admin User",
          role: "ADMIN",
        },
      } as any);

      const result = await hasRole("EMPLOYEE");
      expect(result).toBe(true);
    });

    test("hasRole should return false for insufficient role", async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "1",
          email: "employee@baawa.com",
          name: "Employee User",
          role: "EMPLOYEE",
        },
      } as any);

      const result = await hasRole("MANAGER");
      expect(result).toBe(false);
    });

    test("hasPermission should return true for valid permission", async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "1",
          email: "manager@baawa.com",
          name: "Manager User",
          role: "MANAGER",
        },
      } as any);

      const result = await hasPermission("canAccessReports");
      expect(result).toBe(true);
    });

    test("hasPermission should return false for invalid permission", async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: "1",
          email: "employee@baawa.com",
          name: "Employee User",
          role: "EMPLOYEE",
        },
      } as any);

      const result = await hasPermission("canAccessReports");
      expect(result).toBe(false);
    });

    test("should handle unauthenticated users gracefully", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const roleResult = await hasRole("EMPLOYEE");
      const permissionResult = await hasPermission("canAccessReports");

      expect(roleResult).toBe(false);
      expect(permissionResult).toBe(false);
    });
  });
});
