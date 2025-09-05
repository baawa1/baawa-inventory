import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { hasPermission } from '@/lib/auth/roles';
import type { UserRole } from '@/lib/auth/roles';

/**
 * Custom hook that provides a centralized way to check user permissions
 * Eliminates duplicate permission checking logic across components
 * Automatically memoizes permission checks for better performance
 */
export function usePermissions() {
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole;

  return useMemo(() => {
    if (!userRole) {
      // Return all false permissions if no user role
      return {
        // Inventory permissions
        canReadInventory: false,
        canWriteInventory: false,
        canDeleteInventory: false,
        canViewLowStock: false,

        // Product pricing permissions
        canViewCost: false,
        canViewPrice: false,

        // Category permissions
        canManageCategories: false,
        canDeleteCategories: false,
        
        // Brand permissions
        canManageBrands: false,
        canDeleteBrands: false,

        // Supplier permissions
        canManageSuppliers: false,
        canDeleteSuppliers: false,

        // Finance permissions
        canCreateTransactions: false,
        canReadTransactions: false,
        canApproveFinance: false,
        canDeleteFinance: false,
        canAccessFinancialReports: false,
        canViewFinancialAnalytics: false,
        canViewRevenue: false,
        canViewFinancialAggregates: false,

        // Supplier permissions
        canReadSupplier: false,
        canWriteSupplier: false,
        canViewSupplierNameOnly: false,

        // User management permissions
        canManageUsers: false,
        canApproveUsers: false,

        // Sales permissions
        canReadSales: false,
        canWriteSales: false,

        // POS permissions
        canAccessPOS: false,

        // Reports permissions
        canReadReports: false,
        canViewAdvancedReports: false,
        canViewInventoryReports: false,
        canViewSalesVolumeReports: false,

        // Settings permissions
        canAccessSettings: false,
        canAccessAdvancedSettings: false,

        // Customer permissions
        canViewCustomerPersonalData: false,
        canViewCustomerAnalytics: false,

        // Business intelligence permissions
        canViewSupplierContracts: false,
        canViewBusinessAnalytics: false,
        canViewCompetitiveData: false,

        // System permissions
        canViewAuditLogs: false,
        canConfigureSystem: false,
        canViewUserActivity: false,

        // Convenience computed permissions
        isAdmin: false,
        isManager: false,
        isStaff: false,
        canManageProducts: false,
        canEditProducts: false,
      };
    }

    // Calculate all permissions for the current user role
    return {
      // Inventory permissions
      canReadInventory: hasPermission(userRole, 'INVENTORY_READ'),
      canWriteInventory: hasPermission(userRole, 'INVENTORY_WRITE'),
      canDeleteInventory: hasPermission(userRole, 'INVENTORY_DELETE'),
      canViewLowStock: hasPermission(userRole, 'INVENTORY_LOW_STOCK'),

      // Product pricing permissions
      canViewCost: hasPermission(userRole, 'PRODUCT_COST_READ'),
      canViewPrice: hasPermission(userRole, 'PRODUCT_PRICE_READ'),

      // Finance permissions
      canCreateTransactions: hasPermission(userRole, 'FINANCE_TRANSACTIONS_CREATE'),
      canReadTransactions: hasPermission(userRole, 'FINANCE_TRANSACTIONS_READ'),
      canApproveFinance: hasPermission(userRole, 'FINANCE_APPROVE'),
      canDeleteFinance: hasPermission(userRole, 'FINANCE_DELETE'),
      canAccessFinancialReports: hasPermission(userRole, 'FINANCIAL_REPORTS'),
      canViewFinancialAnalytics: hasPermission(userRole, 'FINANCIAL_ANALYTICS'),
      canViewRevenue: hasPermission(userRole, 'REVENUE_READ'),
      canViewFinancialAggregates: hasPermission(userRole, 'FINANCIAL_AGGREGATES'),

      // Category permissions
      canManageCategories: hasPermission(userRole, 'INVENTORY_WRITE'),
      canDeleteCategories: hasPermission(userRole, 'INVENTORY_DELETE'),
      
      // Brand permissions  
      canManageBrands: hasPermission(userRole, 'INVENTORY_WRITE'),
      canDeleteBrands: hasPermission(userRole, 'INVENTORY_DELETE'),

      // Supplier permissions
      canManageSuppliers: hasPermission(userRole, 'SUPPLIER_WRITE'),
      canDeleteSuppliers: hasPermission(userRole, 'SUPPLIER_WRITE'),
      canReadSupplier: hasPermission(userRole, 'SUPPLIER_READ'),
      canWriteSupplier: hasPermission(userRole, 'SUPPLIER_WRITE'),
      canViewSupplierNameOnly: hasPermission(userRole, 'SUPPLIER_NAME_ONLY'),

      // User management permissions
      canManageUsers: hasPermission(userRole, 'USER_MANAGEMENT'),
      canApproveUsers: hasPermission(userRole, 'USER_APPROVAL'),

      // Sales permissions
      canReadSales: hasPermission(userRole, 'SALES_READ'),
      canWriteSales: hasPermission(userRole, 'SALES_WRITE'),

      // POS permissions
      canAccessPOS: hasPermission(userRole, 'POS_ACCESS'),

      // Reports permissions
      canReadReports: hasPermission(userRole, 'REPORTS_READ'),
      canViewAdvancedReports: hasPermission(userRole, 'REPORTS_ADVANCED'),
      canViewInventoryReports: hasPermission(userRole, 'INVENTORY_REPORTS'),
      canViewSalesVolumeReports: hasPermission(userRole, 'SALES_VOLUME_REPORTS'),

      // Settings permissions
      canAccessSettings: hasPermission(userRole, 'SETTINGS_ACCESS'),
      canAccessAdvancedSettings: hasPermission(userRole, 'SETTINGS_ADVANCED'),

      // Customer permissions
      canViewCustomerPersonalData: hasPermission(userRole, 'CUSTOMER_PERSONAL_DATA'),
      canViewCustomerAnalytics: hasPermission(userRole, 'CUSTOMER_ANALYTICS'),

      // Business intelligence permissions
      canViewSupplierContracts: hasPermission(userRole, 'SUPPLIER_CONTRACTS'),
      canViewBusinessAnalytics: hasPermission(userRole, 'BUSINESS_ANALYTICS'),
      canViewCompetitiveData: hasPermission(userRole, 'COMPETITIVE_DATA'),

      // System permissions
      canViewAuditLogs: hasPermission(userRole, 'AUDIT_LOGS'),
      canConfigureSystem: hasPermission(userRole, 'SYSTEM_CONFIG'),
      canViewUserActivity: hasPermission(userRole, 'USER_ACTIVITY'),

      // Convenience computed permissions (commonly used combinations)
      isAdmin: userRole === 'ADMIN',
      isManager: userRole === 'MANAGER',
      isStaff: userRole === 'STAFF',
      canManageProducts: hasPermission(userRole, 'INVENTORY_WRITE'),
      canEditProducts: hasPermission(userRole, 'INVENTORY_READ'), // Any role that can read can also "edit" (view edit forms)
    };
  }, [userRole]);
}

/**
 * Hook variant that provides session data along with permissions
 * Useful when you need both user data and permissions in the same component
 */
export function usePermissionsWithSession() {
  const { data: session, ...sessionState } = useSession();
  const permissions = usePermissions();

  return {
    session,
    permissions,
    ...sessionState,
  };
}

/**
 * Hook to check specific permission dynamically
 * Useful for runtime permission checks with dynamic permission names
 * 
 * @param permission - The permission key to check
 * @returns boolean indicating if user has the permission
 */
export function useHasPermission(permission: keyof typeof import('@/lib/auth/roles').ROLE_PERMISSIONS) {
  const { data: session } = useSession();
  
  return useMemo(() => {
    if (!session?.user?.role) return false;
    return hasPermission(session.user.role as UserRole, permission);
  }, [session?.user?.role, permission]);
}