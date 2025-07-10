import {
  getRolePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getAllPermissions,
  getAvailableRoles,
} from "@/lib/auth-rbac";
import type { UserRole } from "@/types/user";

describe("RBAC Helper Functions", () => {
  describe("getRolePermissions", () => {
    test("should return correct permissions for ADMIN", () => {
      const permissions = getRolePermissions("ADMIN");
      expect(permissions).toContain("users:read");
      expect(permissions).toContain("users:write");
      expect(permissions).toContain("users:delete");
      expect(permissions).toContain("inventory:read");
      expect(permissions).toContain("inventory:write");
      expect(permissions).toContain("inventory:delete");
      expect(permissions).toContain("reports:read");
      expect(permissions).toContain("reports:write");
      expect(permissions).toContain("settings:read");
      expect(permissions).toContain("settings:write");
      expect(permissions).toContain("audit:read");
      expect(permissions).toContain("pos:read");
      expect(permissions).toContain("pos:write");
    });

    test("should return correct permissions for MANAGER", () => {
      const permissions = getRolePermissions("MANAGER");
      expect(permissions).toContain("users:read");
      expect(permissions).toContain("inventory:read");
      expect(permissions).toContain("inventory:write");
      expect(permissions).toContain("reports:read");
      expect(permissions).toContain("reports:write");
      expect(permissions).toContain("settings:read");
      expect(permissions).toContain("pos:read");
      expect(permissions).toContain("pos:write");

      // Should NOT have admin-only permissions
      expect(permissions).not.toContain("users:write");
      expect(permissions).not.toContain("users:delete");
      expect(permissions).not.toContain("inventory:delete");
      expect(permissions).not.toContain("settings:write");
      expect(permissions).not.toContain("audit:read");
    });

    test("should return correct permissions for STAFF", () => {
      const permissions = getRolePermissions("STAFF");
      expect(permissions).toContain("inventory:read");
      expect(permissions).toContain("inventory:write");
      expect(permissions).toContain("reports:read");
      expect(permissions).toContain("pos:read");
      expect(permissions).toContain("pos:write");

      // Should NOT have admin or manager permissions
      expect(permissions).not.toContain("users:read");
      expect(permissions).not.toContain("users:write");
      expect(permissions).not.toContain("users:delete");
      expect(permissions).not.toContain("inventory:delete");
      expect(permissions).not.toContain("reports:write");
      expect(permissions).not.toContain("settings:read");
      expect(permissions).not.toContain("settings:write");
      expect(permissions).not.toContain("audit:read");
    });

    test("should return empty array for invalid role", () => {
      const permissions = getRolePermissions("INVALID" as UserRole);
      expect(permissions).toEqual([]);
    });
  });

  describe("hasPermission", () => {
    test("should return true for ADMIN with any permission", () => {
      expect(hasPermission("ADMIN", "users:read")).toBe(true);
      expect(hasPermission("ADMIN", "users:write")).toBe(true);
      expect(hasPermission("ADMIN", "users:delete")).toBe(true);
      expect(hasPermission("ADMIN", "inventory:delete")).toBe(true);
      expect(hasPermission("ADMIN", "audit:read")).toBe(true);
    });

    test("should return correct permissions for MANAGER", () => {
      expect(hasPermission("MANAGER", "users:read")).toBe(true);
      expect(hasPermission("MANAGER", "inventory:read")).toBe(true);
      expect(hasPermission("MANAGER", "reports:read")).toBe(true);

      // Should NOT have admin-only permissions
      expect(hasPermission("MANAGER", "users:write")).toBe(false);
      expect(hasPermission("MANAGER", "users:delete")).toBe(false);
      expect(hasPermission("MANAGER", "inventory:delete")).toBe(false);
      expect(hasPermission("MANAGER", "audit:read")).toBe(false);
    });

    test("should return correct permissions for STAFF", () => {
      expect(hasPermission("STAFF", "inventory:read")).toBe(true);
      expect(hasPermission("STAFF", "pos:read")).toBe(true);

      // Should NOT have admin or manager permissions
      expect(hasPermission("STAFF", "users:read")).toBe(false);
      expect(hasPermission("STAFF", "users:write")).toBe(false);
      expect(hasPermission("STAFF", "inventory:delete")).toBe(false);
      expect(hasPermission("STAFF", "reports:write")).toBe(false);
      expect(hasPermission("STAFF", "settings:read")).toBe(false);
    });

    test("should return false for invalid role", () => {
      expect(hasPermission("INVALID" as UserRole, "users:read")).toBe(false);
    });
  });

  describe("hasAnyPermission", () => {
    test("should return true if role has any of the permissions", () => {
      expect(hasAnyPermission("STAFF", ["users:read", "inventory:read"])).toBe(
        true
      );
      expect(
        hasAnyPermission("MANAGER", ["users:write", "inventory:read"])
      ).toBe(true);
      expect(hasAnyPermission("ADMIN", ["users:read", "inventory:read"])).toBe(
        true
      );
    });

    test("should return false if role has none of the permissions", () => {
      expect(hasAnyPermission("STAFF", ["users:read", "users:write"])).toBe(
        false
      );
      expect(hasAnyPermission("MANAGER", ["users:write", "users:delete"])).toBe(
        false
      );
    });
  });

  describe("hasAllPermissions", () => {
    test("should return true if role has all of the permissions", () => {
      expect(hasAllPermissions("ADMIN", ["users:read", "users:write"])).toBe(
        true
      );
      expect(hasAllPermissions("STAFF", ["inventory:read", "pos:read"])).toBe(
        true
      );
      expect(
        hasAllPermissions("MANAGER", ["inventory:read", "reports:read"])
      ).toBe(true);
    });

    test("should return false if role is missing any permission", () => {
      expect(hasAllPermissions("STAFF", ["users:read", "inventory:read"])).toBe(
        false
      );
      expect(
        hasAllPermissions("MANAGER", ["users:write", "inventory:read"])
      ).toBe(false);
    });
  });

  describe("getAllPermissions", () => {
    test("should return all available permissions", () => {
      const permissions = getAllPermissions();
      expect(permissions).toContain("users:read");
      expect(permissions).toContain("users:write");
      expect(permissions).toContain("users:delete");
      expect(permissions).toContain("inventory:read");
      expect(permissions).toContain("inventory:write");
      expect(permissions).toContain("inventory:delete");
      expect(permissions).toContain("reports:read");
      expect(permissions).toContain("reports:write");
      expect(permissions).toContain("settings:read");
      expect(permissions).toContain("settings:write");
      expect(permissions).toContain("audit:read");
      expect(permissions).toContain("pos:read");
      expect(permissions).toContain("pos:write");
    });
  });

  describe("getAvailableRoles", () => {
    test("should return all available roles", () => {
      const roles = getAvailableRoles();
      expect(roles).toContain("ADMIN");
      expect(roles).toContain("MANAGER");
      expect(roles).toContain("STAFF");
      expect(roles).toHaveLength(3);
    });
  });
});
