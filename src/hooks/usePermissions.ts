import { useMemo } from "react";

export type UserRole = "ADMIN" | "MANAGER" | "STAFF";

export interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: UserRole;
  status: string;
  isEmailVerified: boolean;
}

export interface PermissionSet {
  // Product permissions
  canViewProducts: boolean;
  canCreateProducts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;
  canArchiveProducts: boolean;
  canManageProductImages: boolean;
  
  // Category permissions
  canViewCategories: boolean;
  canCreateCategories: boolean;
  canEditCategories: boolean;
  canDeleteCategories: boolean;
  
  // Supplier permissions
  canViewSuppliers: boolean;
  canCreateSuppliers: boolean;
  canEditSuppliers: boolean;
  canDeleteSuppliers: boolean;
  canDeactivateSuppliers: boolean;
  
  // Stock permissions
  canViewStock: boolean;
  canAdjustStock: boolean;
  canReconcileStock: boolean;
  canApproveStockChanges: boolean;
  
  // User management permissions
  canViewUsers: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canApproveUsers: boolean;
  canManageUserRoles: boolean;
  
  // Report permissions
  canViewReports: boolean;
  canExportReports: boolean;
  canViewSalesReports: boolean;
  canViewInventoryReports: boolean;
  
  // System permissions
  canAccessAdmin: boolean;
  canManageSettings: boolean;
  canViewAuditLogs: boolean;
}

const ROLE_PERMISSIONS: Record<UserRole, PermissionSet> = {
  ADMIN: {
    // Product permissions
    canViewProducts: true,
    canCreateProducts: true,
    canEditProducts: true,
    canDeleteProducts: true,
    canArchiveProducts: true,
    canManageProductImages: true,
    
    // Category permissions
    canViewCategories: true,
    canCreateCategories: true,
    canEditCategories: true,
    canDeleteCategories: true,
    
    // Supplier permissions
    canViewSuppliers: true,
    canCreateSuppliers: true,
    canEditSuppliers: true,
    canDeleteSuppliers: true,
    canDeactivateSuppliers: true,
    
    // Stock permissions
    canViewStock: true,
    canAdjustStock: true,
    canReconcileStock: true,
    canApproveStockChanges: true,
    
    // User management permissions
    canViewUsers: true,
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canApproveUsers: true,
    canManageUserRoles: true,
    
    // Report permissions
    canViewReports: true,
    canExportReports: true,
    canViewSalesReports: true,
    canViewInventoryReports: true,
    
    // System permissions
    canAccessAdmin: true,
    canManageSettings: true,
    canViewAuditLogs: true,
  },
  
  MANAGER: {
    // Product permissions
    canViewProducts: true,
    canCreateProducts: true,
    canEditProducts: true,
    canDeleteProducts: false,
    canArchiveProducts: true,
    canManageProductImages: true,
    
    // Category permissions
    canViewCategories: true,
    canCreateCategories: true,
    canEditCategories: true,
    canDeleteCategories: false,
    
    // Supplier permissions
    canViewSuppliers: true,
    canCreateSuppliers: true,
    canEditSuppliers: true,
    canDeleteSuppliers: false,
    canDeactivateSuppliers: false,
    
    // Stock permissions
    canViewStock: true,
    canAdjustStock: true,
    canReconcileStock: true,
    canApproveStockChanges: false,
    
    // User management permissions
    canViewUsers: true,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canApproveUsers: false,
    canManageUserRoles: false,
    
    // Report permissions
    canViewReports: true,
    canExportReports: true,
    canViewSalesReports: true,
    canViewInventoryReports: true,
    
    // System permissions
    canAccessAdmin: false,
    canManageSettings: false,
    canViewAuditLogs: false,
  },
  
  STAFF: {
    // Product permissions
    canViewProducts: true,
    canCreateProducts: false,
    canEditProducts: true,
    canDeleteProducts: false,
    canArchiveProducts: false,
    canManageProductImages: false,
    
    // Category permissions
    canViewCategories: true,
    canCreateCategories: false,
    canEditCategories: false,
    canDeleteCategories: false,
    
    // Supplier permissions
    canViewSuppliers: true,
    canCreateSuppliers: false,
    canEditSuppliers: false,
    canDeleteSuppliers: false,
    canDeactivateSuppliers: false,
    
    // Stock permissions
    canViewStock: true,
    canAdjustStock: false,
    canReconcileStock: false,
    canApproveStockChanges: false,
    
    // User management permissions
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canApproveUsers: false,
    canManageUserRoles: false,
    
    // Report permissions
    canViewReports: false,
    canExportReports: false,
    canViewSalesReports: false,
    canViewInventoryReports: false,
    
    // System permissions
    canAccessAdmin: false,
    canManageSettings: false,
    canViewAuditLogs: false,
  },
};

export function usePermissions(user: User | null): PermissionSet {
  return useMemo(() => {
    if (!user || !user.role) {
      // Return no permissions for unauthenticated users
      return Object.fromEntries(
        Object.keys(ROLE_PERMISSIONS.STAFF).map((key) => [key, false])
      ) as PermissionSet;
    }
    
    return ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.STAFF;
  }, [user]);
}

// Utility functions for common permission checks
export const checkPermission = (user: User | null, permission: keyof PermissionSet): boolean => {
  if (!user) return false;
  const permissions = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.STAFF;
  return permissions[permission];
};

export const hasAnyPermission = (user: User | null, permissions: Array<keyof PermissionSet>): boolean => {
  return permissions.some((permission) => checkPermission(user, permission));
};

export const hasAllPermissions = (user: User | null, permissions: Array<keyof PermissionSet>): boolean => {
  return permissions.every((permission) => checkPermission(user, permission));
};

// Legacy permission helpers (for backward compatibility)
export const canManageProducts = (user: User | null): boolean => {
  return checkPermission(user, "canCreateProducts") || checkPermission(user, "canEditProducts");
};

export const canManageCategories = (user: User | null): boolean => {
  return checkPermission(user, "canCreateCategories") || checkPermission(user, "canEditCategories");
};

export const canManageSuppliers = (user: User | null): boolean => {
  return checkPermission(user, "canCreateSuppliers") || checkPermission(user, "canEditSuppliers");
};

export const canManageStock = (user: User | null): boolean => {
  return checkPermission(user, "canAdjustStock") || checkPermission(user, "canReconcileStock");
};