/**
 * Comprehensive Unit Tests for Auth Roles System
 * Tests all role-based access control functions and permissions
 */

import {
  USER_ROLES,
  ALL_ROLES,
  ROLE_HIERARCHY,
  ROLE_DISPLAY_NAMES,
  ROLE_DESCRIPTIONS,
  ROLE_PERMISSIONS,
  hasRole,
  hasPermission,
  isAdmin,
  isManager,
  isStaff,
  canManageInventory,
  canDeleteInventory,
  canManageUsers,
  canAccessPOS,
  canAccessReports,
  canAccessSettings,
  canViewLowStock,
  canReadFinance,
  canWriteFinance,
  canApproveFinance,
  canDeleteFinance,
  authorizeUserForRoute,
} from '@/lib/auth/roles';

describe('Auth Roles System', () => {
  describe('Role Constants', () => {
    it('should have correct role definitions', () => {
      expect(USER_ROLES.ADMIN).toBe('ADMIN');
      expect(USER_ROLES.MANAGER).toBe('MANAGER');
      expect(USER_ROLES.STAFF).toBe('STAFF');
    });

    it('should have all roles in ALL_ROLES array', () => {
      expect(ALL_ROLES).toEqual(['ADMIN', 'MANAGER', 'STAFF']);
      expect(ALL_ROLES).toHaveLength(3);
    });

    it('should have correct role hierarchy', () => {
      expect(ROLE_HIERARCHY[USER_ROLES.ADMIN]).toBe(3);
      expect(ROLE_HIERARCHY[USER_ROLES.MANAGER]).toBe(2);
      expect(ROLE_HIERARCHY[USER_ROLES.STAFF]).toBe(1);
    });

    it('should have display names for all roles', () => {
      expect(ROLE_DISPLAY_NAMES[USER_ROLES.ADMIN]).toBe('Administrator');
      expect(ROLE_DISPLAY_NAMES[USER_ROLES.MANAGER]).toBe('Manager');
      expect(ROLE_DISPLAY_NAMES[USER_ROLES.STAFF]).toBe('Staff');
    });

    it('should have descriptions for all roles', () => {
      expect(ROLE_DESCRIPTIONS[USER_ROLES.ADMIN]).toBeTruthy();
      expect(ROLE_DESCRIPTIONS[USER_ROLES.MANAGER]).toBeTruthy();
      expect(ROLE_DESCRIPTIONS[USER_ROLES.STAFF]).toBeTruthy();
    });
  });

  describe('hasRole Function', () => {
    it('should return true for valid role matches', () => {
      expect(hasRole('ADMIN', [USER_ROLES.ADMIN])).toBe(true);
      expect(hasRole('MANAGER', [USER_ROLES.MANAGER])).toBe(true);
      expect(hasRole('STAFF', [USER_ROLES.STAFF])).toBe(true);
    });

    it('should return true for role in allowed roles array', () => {
      expect(hasRole('ADMIN', [USER_ROLES.ADMIN, USER_ROLES.MANAGER])).toBe(true);
      expect(hasRole('MANAGER', [USER_ROLES.ADMIN, USER_ROLES.MANAGER])).toBe(true);
      expect(hasRole('STAFF', [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF])).toBe(true);
    });

    it('should return false for role not in allowed roles', () => {
      expect(hasRole('STAFF', [USER_ROLES.ADMIN, USER_ROLES.MANAGER])).toBe(false);
      expect(hasRole('MANAGER', [USER_ROLES.ADMIN])).toBe(false);
      expect(hasRole('STAFF', [USER_ROLES.ADMIN])).toBe(false);
    });

    it('should return false for null/undefined/empty roles', () => {
      expect(hasRole(null, [USER_ROLES.ADMIN])).toBe(false);
      expect(hasRole(undefined, [USER_ROLES.ADMIN])).toBe(false);
      expect(hasRole('', [USER_ROLES.ADMIN])).toBe(false);
    });

    it('should return false for invalid roles', () => {
      expect(hasRole('INVALID_ROLE', [USER_ROLES.ADMIN])).toBe(false);
      expect(hasRole('admin', [USER_ROLES.ADMIN])).toBe(false); // Case sensitive
    });
  });

  describe('hasPermission Function', () => {
    it('should grant inventory read permissions correctly', () => {
      expect(hasPermission('ADMIN', 'INVENTORY_READ')).toBe(true);
      expect(hasPermission('MANAGER', 'INVENTORY_READ')).toBe(true);
      expect(hasPermission('STAFF', 'INVENTORY_READ')).toBe(true);
    });

    it('should grant inventory write permissions correctly', () => {
      expect(hasPermission('ADMIN', 'INVENTORY_WRITE')).toBe(true);
      expect(hasPermission('MANAGER', 'INVENTORY_WRITE')).toBe(true);
      expect(hasPermission('STAFF', 'INVENTORY_WRITE')).toBe(false);
    });

    it('should grant inventory delete permissions correctly', () => {
      expect(hasPermission('ADMIN', 'INVENTORY_DELETE')).toBe(true);
      expect(hasPermission('MANAGER', 'INVENTORY_DELETE')).toBe(false);
      expect(hasPermission('STAFF', 'INVENTORY_DELETE')).toBe(false);
    });

    it('should grant user management permissions correctly', () => {
      expect(hasPermission('ADMIN', 'USER_MANAGEMENT')).toBe(true);
      expect(hasPermission('MANAGER', 'USER_MANAGEMENT')).toBe(false);
      expect(hasPermission('STAFF', 'USER_MANAGEMENT')).toBe(false);
    });

    it('should grant POS access permissions correctly', () => {
      expect(hasPermission('ADMIN', 'POS_ACCESS')).toBe(true);
      expect(hasPermission('MANAGER', 'POS_ACCESS')).toBe(true);
      expect(hasPermission('STAFF', 'POS_ACCESS')).toBe(true);
    });

    it('should grant reports permissions correctly', () => {
      expect(hasPermission('ADMIN', 'REPORTS_READ')).toBe(true);
      expect(hasPermission('MANAGER', 'REPORTS_READ')).toBe(true);
      expect(hasPermission('STAFF', 'REPORTS_READ')).toBe(false);
    });

    it('should grant settings permissions correctly', () => {
      expect(hasPermission('ADMIN', 'SETTINGS_ACCESS')).toBe(true);
      expect(hasPermission('MANAGER', 'SETTINGS_ACCESS')).toBe(true);
      expect(hasPermission('STAFF', 'SETTINGS_ACCESS')).toBe(false);

      expect(hasPermission('ADMIN', 'SETTINGS_ADVANCED')).toBe(true);
      expect(hasPermission('MANAGER', 'SETTINGS_ADVANCED')).toBe(false);
      expect(hasPermission('STAFF', 'SETTINGS_ADVANCED')).toBe(false);
    });

    it('should grant finance permissions correctly', () => {
      expect(hasPermission('ADMIN', 'FINANCE_READ')).toBe(true);
      expect(hasPermission('MANAGER', 'FINANCE_READ')).toBe(true);
      expect(hasPermission('STAFF', 'FINANCE_READ')).toBe(true);

      expect(hasPermission('ADMIN', 'FINANCE_WRITE')).toBe(true);
      expect(hasPermission('MANAGER', 'FINANCE_WRITE')).toBe(true);
      expect(hasPermission('STAFF', 'FINANCE_WRITE')).toBe(false);

      expect(hasPermission('ADMIN', 'FINANCE_DELETE')).toBe(true);
      expect(hasPermission('MANAGER', 'FINANCE_DELETE')).toBe(false);
      expect(hasPermission('STAFF', 'FINANCE_DELETE')).toBe(false);
    });

    it('should return false for null/undefined roles', () => {
      expect(hasPermission(null, 'INVENTORY_READ')).toBe(false);
      expect(hasPermission(undefined, 'INVENTORY_READ')).toBe(false);
    });

    it('should handle invalid permissions gracefully', () => {
      // The function expects a valid permission key, so invalid keys may throw
      // This is expected behavior for TypeScript type safety
      expect(() => hasPermission('ADMIN', 'INVALID_PERMISSION' as any)).toThrow();
    });
  });

  describe('Role Check Functions', () => {
    describe('isAdmin', () => {
      it('should return true for ADMIN role', () => {
        expect(isAdmin('ADMIN')).toBe(true);
      });

      it('should return false for non-ADMIN roles', () => {
        expect(isAdmin('MANAGER')).toBe(false);
        expect(isAdmin('STAFF')).toBe(false);
        expect(isAdmin(null)).toBe(false);
        expect(isAdmin(undefined)).toBe(false);
      });
    });

    describe('isManager', () => {
      it('should return true for MANAGER role', () => {
        expect(isManager('MANAGER')).toBe(true);
      });

      it('should return false for non-MANAGER roles', () => {
        expect(isManager('ADMIN')).toBe(false);
        expect(isManager('STAFF')).toBe(false);
        expect(isManager(null)).toBe(false);
        expect(isManager(undefined)).toBe(false);
      });
    });

    describe('isStaff', () => {
      it('should return true for STAFF role', () => {
        expect(isStaff('STAFF')).toBe(true);
      });

      it('should return false for non-STAFF roles', () => {
        expect(isStaff('ADMIN')).toBe(false);
        expect(isStaff('MANAGER')).toBe(false);
        expect(isStaff(null)).toBe(false);
        expect(isStaff(undefined)).toBe(false);
      });
    });
  });

  describe('Permission Helper Functions', () => {
    describe('canManageInventory', () => {
      it('should allow ADMIN and MANAGER to manage inventory', () => {
        expect(canManageInventory('ADMIN')).toBe(true);
        expect(canManageInventory('MANAGER')).toBe(true);
      });

      it('should not allow STAFF to manage inventory', () => {
        expect(canManageInventory('STAFF')).toBe(false);
      });
    });

    describe('canDeleteInventory', () => {
      it('should only allow ADMIN to delete inventory', () => {
        expect(canDeleteInventory('ADMIN')).toBe(true);
        expect(canDeleteInventory('MANAGER')).toBe(false);
        expect(canDeleteInventory('STAFF')).toBe(false);
      });
    });

    describe('canManageUsers', () => {
      it('should only allow ADMIN to manage users', () => {
        expect(canManageUsers('ADMIN')).toBe(true);
        expect(canManageUsers('MANAGER')).toBe(false);
        expect(canManageUsers('STAFF')).toBe(false);
      });
    });

    describe('canAccessPOS', () => {
      it('should allow all roles to access POS', () => {
        expect(canAccessPOS('ADMIN')).toBe(true);
        expect(canAccessPOS('MANAGER')).toBe(true);
        expect(canAccessPOS('STAFF')).toBe(true);
      });
    });

    describe('canAccessReports', () => {
      it('should allow ADMIN and MANAGER to access reports', () => {
        expect(canAccessReports('ADMIN')).toBe(true);
        expect(canAccessReports('MANAGER')).toBe(true);
      });

      it('should not allow STAFF to access reports', () => {
        expect(canAccessReports('STAFF')).toBe(false);
      });
    });

    describe('canAccessSettings', () => {
      it('should allow ADMIN and MANAGER to access settings', () => {
        expect(canAccessSettings('ADMIN')).toBe(true);
        expect(canAccessSettings('MANAGER')).toBe(true);
      });

      it('should not allow STAFF to access settings', () => {
        expect(canAccessSettings('STAFF')).toBe(false);
      });
    });

    describe('canViewLowStock', () => {
      it('should allow ADMIN and MANAGER to view low stock', () => {
        expect(canViewLowStock('ADMIN')).toBe(true);
        expect(canViewLowStock('MANAGER')).toBe(true);
      });

      it('should not allow STAFF to view low stock', () => {
        expect(canViewLowStock('STAFF')).toBe(false);
      });
    });

    describe('Finance Permission Functions', () => {
      it('should grant read finance permissions correctly', () => {
        expect(canReadFinance('ADMIN')).toBe(true);
        expect(canReadFinance('MANAGER')).toBe(true);
        expect(canReadFinance('STAFF')).toBe(true);
      });

      it('should grant write finance permissions correctly', () => {
        expect(canWriteFinance('ADMIN')).toBe(true);
        expect(canWriteFinance('MANAGER')).toBe(true);
        expect(canWriteFinance('STAFF')).toBe(false);
      });

      it('should grant approve finance permissions correctly', () => {
        expect(canApproveFinance('ADMIN')).toBe(true);
        expect(canApproveFinance('MANAGER')).toBe(true);
        expect(canApproveFinance('STAFF')).toBe(false);
      });

      it('should grant delete finance permissions correctly', () => {
        expect(canDeleteFinance('ADMIN')).toBe(true);
        expect(canDeleteFinance('MANAGER')).toBe(false);
        expect(canDeleteFinance('STAFF')).toBe(false);
      });
    });
  });

  describe('Route Authorization', () => {
    describe('authorizeUserForRoute', () => {
      it('should allow ADMIN access to all routes', () => {
        expect(authorizeUserForRoute('ADMIN', '/admin/users')).toBe(true);
        expect(authorizeUserForRoute('ADMIN', '/reports/sales')).toBe(true);
        expect(authorizeUserForRoute('ADMIN', '/settings/general')).toBe(true);
        expect(authorizeUserForRoute('ADMIN', '/pos/checkout')).toBe(true);
        expect(authorizeUserForRoute('ADMIN', '/dashboard')).toBe(true);
      });

      it('should restrict admin routes to ADMIN only', () => {
        expect(authorizeUserForRoute('ADMIN', '/admin/users')).toBe(true);
        expect(authorizeUserForRoute('MANAGER', '/admin/users')).toBe(false);
        expect(authorizeUserForRoute('STAFF', '/admin/users')).toBe(false);
      });

      it('should allow ADMIN and MANAGER access to reports and settings', () => {
        expect(authorizeUserForRoute('ADMIN', '/reports/sales')).toBe(true);
        expect(authorizeUserForRoute('MANAGER', '/reports/sales')).toBe(true);
        expect(authorizeUserForRoute('STAFF', '/reports/sales')).toBe(false);

        expect(authorizeUserForRoute('ADMIN', '/settings/general')).toBe(true);
        expect(authorizeUserForRoute('MANAGER', '/settings/general')).toBe(true);
        expect(authorizeUserForRoute('STAFF', '/settings/general')).toBe(false);
      });

      it('should allow all roles access to POS routes', () => {
        expect(authorizeUserForRoute('ADMIN', '/pos/checkout')).toBe(true);
        expect(authorizeUserForRoute('MANAGER', '/pos/checkout')).toBe(true);
        expect(authorizeUserForRoute('STAFF', '/pos/checkout')).toBe(true);
      });

      it('should allow all roles access to default routes', () => {
        expect(authorizeUserForRoute('ADMIN', '/dashboard')).toBe(true);
        expect(authorizeUserForRoute('MANAGER', '/dashboard')).toBe(true);
        expect(authorizeUserForRoute('STAFF', '/dashboard')).toBe(true);

        expect(authorizeUserForRoute('ADMIN', '/inventory')).toBe(true);
        expect(authorizeUserForRoute('MANAGER', '/inventory')).toBe(true);
        expect(authorizeUserForRoute('STAFF', '/inventory')).toBe(true);
      });

      it('should return false for null/undefined roles', () => {
        expect(authorizeUserForRoute(null, '/dashboard')).toBe(false);
        expect(authorizeUserForRoute(undefined, '/dashboard')).toBe(false);
      });

      it('should handle edge cases correctly', () => {
        // Invalid roles still get access to default routes like /dashboard
        // because the function returns true for any role on default routes
        expect(authorizeUserForRoute('INVALID_ROLE', '/dashboard')).toBe(true);
        expect(authorizeUserForRoute('', '/dashboard')).toBe(false); // Empty string is falsy
        
        // But invalid roles should not get access to restricted routes
        expect(authorizeUserForRoute('INVALID_ROLE', '/admin/users')).toBe(false);
        expect(authorizeUserForRoute('INVALID_ROLE', '/reports/sales')).toBe(false);
      });
    });
  });

  describe('Permission System Completeness', () => {
    it('should have all permissions defined in ROLE_PERMISSIONS', () => {
      const expectedPermissions = [
        'INVENTORY_READ',
        'INVENTORY_WRITE', 
        'INVENTORY_DELETE',
        'INVENTORY_LOW_STOCK',
        'USER_MANAGEMENT',
        'USER_APPROVAL',
        'SALES_READ',
        'SALES_WRITE',
        'POS_ACCESS',
        'REPORTS_READ',
        'REPORTS_ADVANCED',
        'SETTINGS_ACCESS',
        'SETTINGS_ADVANCED',
        'FINANCE_READ',
        'FINANCE_WRITE',
        'FINANCE_APPROVE',
        'FINANCE_DELETE',
      ];

      expectedPermissions.forEach(permission => {
        expect(ROLE_PERMISSIONS).toHaveProperty(permission);
        expect(Array.isArray(ROLE_PERMISSIONS[permission as keyof typeof ROLE_PERMISSIONS])).toBe(true);
      });
    });

    it('should ensure all roles have at least basic permissions', () => {
      // All roles should be able to read sales and access POS
      expect(ROLE_PERMISSIONS.SALES_READ).toContain('ADMIN');
      expect(ROLE_PERMISSIONS.SALES_READ).toContain('MANAGER'); 
      expect(ROLE_PERMISSIONS.SALES_READ).toContain('STAFF');

      expect(ROLE_PERMISSIONS.POS_ACCESS).toContain('ADMIN');
      expect(ROLE_PERMISSIONS.POS_ACCESS).toContain('MANAGER');
      expect(ROLE_PERMISSIONS.POS_ACCESS).toContain('STAFF');
    });

    it('should maintain proper permission hierarchy', () => {
      // ADMIN should have the most permissions
      const adminPermissions = Object.values(ROLE_PERMISSIONS).filter(roles => roles.includes('ADMIN')).length;
      const managerPermissions = Object.values(ROLE_PERMISSIONS).filter(roles => roles.includes('MANAGER')).length;
      const staffPermissions = Object.values(ROLE_PERMISSIONS).filter(roles => roles.includes('STAFF')).length;

      expect(adminPermissions).toBeGreaterThan(managerPermissions);
      expect(managerPermissions).toBeGreaterThan(staffPermissions);
    });
  });
});