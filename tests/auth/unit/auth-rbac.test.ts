/**
 * Comprehensive Unit Tests for Server-Side RBAC System
 * Tests the server-side role-based access control functions
 */

import {
  getRolePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getAllPermissions,
  getAvailableRoles,
} from '@/lib/auth-rbac';
import type { UserRole } from '@/types/user';

describe('Server-Side RBAC System', () => {
  describe('getRolePermissions', () => {
    it('should return correct permissions for ADMIN role', () => {
      const adminPermissions = getRolePermissions('ADMIN');
      
      expect(adminPermissions).toContain('users:read');
      expect(adminPermissions).toContain('users:write');
      expect(adminPermissions).toContain('users:delete');
      expect(adminPermissions).toContain('inventory:read');
      expect(adminPermissions).toContain('inventory:write');
      expect(adminPermissions).toContain('inventory:delete');
      expect(adminPermissions).toContain('reports:read');
      expect(adminPermissions).toContain('reports:write');
      expect(adminPermissions).toContain('settings:read');
      expect(adminPermissions).toContain('settings:write');
      expect(adminPermissions).toContain('audit:read');
      expect(adminPermissions).toContain('pos:read');
      expect(adminPermissions).toContain('pos:write');
      
      // ADMIN should have the most permissions
      expect(adminPermissions.length).toBeGreaterThan(10);
    });

    it('should return correct permissions for MANAGER role', () => {
      const managerPermissions = getRolePermissions('MANAGER');
      
      expect(managerPermissions).toContain('users:read');
      expect(managerPermissions).toContain('inventory:read');
      expect(managerPermissions).toContain('inventory:write');
      expect(managerPermissions).toContain('reports:read');
      expect(managerPermissions).toContain('reports:write');
      expect(managerPermissions).toContain('settings:read');
      expect(managerPermissions).toContain('pos:read');
      expect(managerPermissions).toContain('pos:write');
      
      // MANAGER should NOT have admin-only permissions
      expect(managerPermissions).not.toContain('users:write');
      expect(managerPermissions).not.toContain('users:delete');
      expect(managerPermissions).not.toContain('inventory:delete');
      expect(managerPermissions).not.toContain('settings:write');
      expect(managerPermissions).not.toContain('audit:read');
    });

    it('should return correct permissions for STAFF role', () => {
      const staffPermissions = getRolePermissions('STAFF');
      
      expect(staffPermissions).toContain('inventory:read');
      expect(staffPermissions).toContain('inventory:write');
      expect(staffPermissions).toContain('reports:read');
      expect(staffPermissions).toContain('pos:read');
      expect(staffPermissions).toContain('pos:write');
      
      // STAFF should NOT have admin/manager permissions
      expect(staffPermissions).not.toContain('users:read');
      expect(staffPermissions).not.toContain('users:write');
      expect(staffPermissions).not.toContain('users:delete');
      expect(staffPermissions).not.toContain('inventory:delete');
      expect(staffPermissions).not.toContain('reports:write');
      expect(staffPermissions).not.toContain('settings:read');
      expect(staffPermissions).not.toContain('settings:write');
      expect(staffPermissions).not.toContain('audit:read');
      
      // STAFF should have the fewest permissions
      expect(staffPermissions.length).toBeLessThan(getRolePermissions('MANAGER').length);
    });

    it('should return empty array for invalid role', () => {
      const invalidPermissions = getRolePermissions('INVALID_ROLE' as UserRole);
      expect(invalidPermissions).toEqual([]);
    });
  });

  describe('hasPermission', () => {
    it('should correctly check individual permissions for ADMIN', () => {
      expect(hasPermission('ADMIN', 'users:delete')).toBe(true);
      expect(hasPermission('ADMIN', 'inventory:delete')).toBe(true);
      expect(hasPermission('ADMIN', 'settings:write')).toBe(true);
      expect(hasPermission('ADMIN', 'audit:read')).toBe(true);
      expect(hasPermission('ADMIN', 'pos:write')).toBe(true);
    });

    it('should correctly check individual permissions for MANAGER', () => {
      expect(hasPermission('MANAGER', 'users:read')).toBe(true);
      expect(hasPermission('MANAGER', 'inventory:write')).toBe(true);
      expect(hasPermission('MANAGER', 'reports:write')).toBe(true);
      expect(hasPermission('MANAGER', 'pos:write')).toBe(true);
      
      // Should NOT have admin-only permissions
      expect(hasPermission('MANAGER', 'users:delete')).toBe(false);
      expect(hasPermission('MANAGER', 'inventory:delete')).toBe(false);
      expect(hasPermission('MANAGER', 'settings:write')).toBe(false);
      expect(hasPermission('MANAGER', 'audit:read')).toBe(false);
    });

    it('should correctly check individual permissions for STAFF', () => {
      expect(hasPermission('STAFF', 'inventory:read')).toBe(true);
      expect(hasPermission('STAFF', 'inventory:write')).toBe(true);
      expect(hasPermission('STAFF', 'reports:read')).toBe(true);
      expect(hasPermission('STAFF', 'pos:read')).toBe(true);
      expect(hasPermission('STAFF', 'pos:write')).toBe(true);
      
      // Should NOT have admin/manager permissions
      expect(hasPermission('STAFF', 'users:read')).toBe(false);
      expect(hasPermission('STAFF', 'reports:write')).toBe(false);
      expect(hasPermission('STAFF', 'settings:read')).toBe(false);
    });

    it('should return false for invalid role', () => {
      expect(hasPermission('INVALID_ROLE' as UserRole, 'inventory:read')).toBe(false);
    });

    it('should return false for invalid permission', () => {
      expect(hasPermission('ADMIN', 'invalid:permission')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if role has any of the specified permissions', () => {
      expect(hasAnyPermission('ADMIN', ['users:delete', 'invalid:permission'])).toBe(true);
      expect(hasAnyPermission('MANAGER', ['inventory:write', 'invalid:permission'])).toBe(true);
      expect(hasAnyPermission('STAFF', ['pos:read', 'invalid:permission'])).toBe(true);
    });

    it('should return false if role has none of the specified permissions', () => {
      expect(hasAnyPermission('STAFF', ['users:delete', 'audit:read'])).toBe(false);
      expect(hasAnyPermission('MANAGER', ['users:delete', 'audit:read'])).toBe(false);
    });

    it('should return true if role has all specified permissions', () => {
      expect(hasAnyPermission('ADMIN', ['users:read', 'inventory:read'])).toBe(true);
      expect(hasAnyPermission('MANAGER', ['inventory:read', 'reports:read'])).toBe(true);
    });

    it('should handle empty permissions array', () => {
      expect(hasAnyPermission('ADMIN', [])).toBe(false);
      expect(hasAnyPermission('MANAGER', [])).toBe(false);
      expect(hasAnyPermission('STAFF', [])).toBe(false);
    });

    it('should return false for invalid role', () => {
      expect(hasAnyPermission('INVALID_ROLE' as UserRole, ['inventory:read'])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if role has all specified permissions', () => {
      expect(hasAllPermissions('ADMIN', ['users:read', 'inventory:read', 'pos:read'])).toBe(true);
      expect(hasAllPermissions('MANAGER', ['inventory:read', 'reports:read', 'pos:read'])).toBe(true);
      expect(hasAllPermissions('STAFF', ['inventory:read', 'pos:read'])).toBe(true);
    });

    it('should return false if role is missing any specified permission', () => {
      expect(hasAllPermissions('STAFF', ['inventory:read', 'users:read'])).toBe(false);
      expect(hasAllPermissions('MANAGER', ['inventory:read', 'audit:read'])).toBe(false);
    });

    it('should return true for empty permissions array', () => {
      expect(hasAllPermissions('ADMIN', [])).toBe(true);
      expect(hasAllPermissions('MANAGER', [])).toBe(true);
      expect(hasAllPermissions('STAFF', [])).toBe(true);
    });

    it('should return false for invalid role with permissions', () => {
      expect(hasAllPermissions('INVALID_ROLE' as UserRole, ['inventory:read'])).toBe(false);
    });

    it('should handle single permission correctly', () => {
      expect(hasAllPermissions('ADMIN', ['users:delete'])).toBe(true);
      expect(hasAllPermissions('MANAGER', ['users:delete'])).toBe(false);
      expect(hasAllPermissions('STAFF', ['users:delete'])).toBe(false);
    });
  });

  describe('getAllPermissions', () => {
    it('should return all permissions from all roles (may contain duplicates)', () => {
      const allPermissions = getAllPermissions();
      
      expect(allPermissions).toContain('users:read');
      expect(allPermissions).toContain('users:write');
      expect(allPermissions).toContain('users:delete');
      expect(allPermissions).toContain('inventory:read');
      expect(allPermissions).toContain('inventory:write');
      expect(allPermissions).toContain('inventory:delete');
      expect(allPermissions).toContain('reports:read');
      expect(allPermissions).toContain('reports:write');
      expect(allPermissions).toContain('settings:read');
      expect(allPermissions).toContain('settings:write');
      expect(allPermissions).toContain('audit:read');
      expect(allPermissions).toContain('pos:read');
      expect(allPermissions).toContain('pos:write');
      
      // Check unique permissions exist
      const uniquePermissions = [...new Set(allPermissions)];
      expect(uniquePermissions.length).toBeGreaterThan(0);
      expect(uniquePermissions.length).toBeLessThanOrEqual(allPermissions.length);
    });

    it('should return non-empty array', () => {
      const allPermissions = getAllPermissions();
      expect(allPermissions.length).toBeGreaterThan(0);
    });
  });

  describe('getAvailableRoles', () => {
    it('should return all available roles', () => {
      const availableRoles = getAvailableRoles();
      
      expect(availableRoles).toContain('ADMIN');
      expect(availableRoles).toContain('MANAGER');
      expect(availableRoles).toContain('STAFF');
      expect(availableRoles).toHaveLength(3);
    });

    it('should return roles as UserRole type', () => {
      const availableRoles = getAvailableRoles();
      
      availableRoles.forEach(role => {
        expect(['ADMIN', 'MANAGER', 'STAFF']).toContain(role);
      });
    });
  });

  describe('Permission System Integrity', () => {
    it('should maintain role hierarchy in permissions', () => {
      const adminPermissions = getRolePermissions('ADMIN');
      const managerPermissions = getRolePermissions('MANAGER');
      const staffPermissions = getRolePermissions('STAFF');
      
      // ADMIN should have more permissions than MANAGER
      expect(adminPermissions.length).toBeGreaterThan(managerPermissions.length);
      
      // MANAGER should have more permissions than STAFF  
      expect(managerPermissions.length).toBeGreaterThan(staffPermissions.length);
    });

    it('should have consistent permission naming convention', () => {
      const allPermissions = getAllPermissions();
      
      allPermissions.forEach(permission => {
        // Permissions should follow "resource:action" format
        expect(permission).toMatch(/^[a-z]+:[a-z]+$/);
        expect(permission).toContain(':');
        
        const [resource, action] = permission.split(':');
        expect(resource.length).toBeGreaterThan(0);
        expect(action.length).toBeGreaterThan(0);
      });
    });

    it('should ensure basic permissions are available to all roles', () => {
      // All roles should have basic inventory and POS access
      expect(hasPermission('ADMIN', 'inventory:read')).toBe(true);
      expect(hasPermission('MANAGER', 'inventory:read')).toBe(true);
      expect(hasPermission('STAFF', 'inventory:read')).toBe(true);
      
      expect(hasPermission('ADMIN', 'pos:read')).toBe(true);
      expect(hasPermission('MANAGER', 'pos:read')).toBe(true);
      expect(hasPermission('STAFF', 'pos:read')).toBe(true);
    });

    it('should ensure sensitive permissions are restricted', () => {
      // Only ADMIN should have delete permissions
      expect(hasPermission('ADMIN', 'users:delete')).toBe(true);
      expect(hasPermission('MANAGER', 'users:delete')).toBe(false);
      expect(hasPermission('STAFF', 'users:delete')).toBe(false);
      
      expect(hasPermission('ADMIN', 'inventory:delete')).toBe(true);
      expect(hasPermission('MANAGER', 'inventory:delete')).toBe(false);
      expect(hasPermission('STAFF', 'inventory:delete')).toBe(false);
      
      // Only ADMIN should have audit access
      expect(hasPermission('ADMIN', 'audit:read')).toBe(true);
      expect(hasPermission('MANAGER', 'audit:read')).toBe(false);
      expect(hasPermission('STAFF', 'audit:read')).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined roles gracefully', () => {
      expect(getRolePermissions(null as any)).toEqual([]);
      expect(getRolePermissions(undefined as any)).toEqual([]);
      
      expect(hasPermission(null as any, 'inventory:read')).toBe(false);
      expect(hasPermission(undefined as any, 'inventory:read')).toBe(false);
      
      expect(hasAnyPermission(null as any, ['inventory:read'])).toBe(false);
      expect(hasAllPermissions(null as any, ['inventory:read'])).toBe(false);
    });

    it('should handle empty strings gracefully', () => {
      expect(getRolePermissions('' as UserRole)).toEqual([]);
      expect(hasPermission('' as UserRole, 'inventory:read')).toBe(false);
    });

    it('should handle case sensitivity correctly', () => {
      expect(hasPermission('admin' as UserRole, 'inventory:read')).toBe(false);
      expect(hasPermission('ADMIN', 'INVENTORY:READ')).toBe(false);
      expect(hasPermission('ADMIN', 'inventory:READ')).toBe(false);
    });
  });
});