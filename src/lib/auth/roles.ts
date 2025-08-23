/**
 * Central Role Management System
 * This file is the single source of truth for all role definitions in the application.
 * All role-related code should import from this file to ensure consistency.
 */

// Define the exact role names as string literals (UPPER_CASE for constants)
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
} as const;

// Type for user roles based on the USER_ROLES object
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Array of all valid roles for validation purposes
export const ALL_ROLES = Object.values(USER_ROLES);

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [USER_ROLES.STAFF]: 1,
  [USER_ROLES.MANAGER]: 2,
  [USER_ROLES.ADMIN]: 3,
};

// Role display names for UI presentation
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.MANAGER]: 'Manager',
  [USER_ROLES.STAFF]: 'Staff',
};

// Role descriptions for documentation and UI
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [USER_ROLES.ADMIN]: 'Full access to all system features and user management',
  [USER_ROLES.MANAGER]:
    'Can manage inventory, view reports, and handle day-to-day operations',
  [USER_ROLES.STAFF]:
    'Can view inventory, process sales, and access basic reports',
};

// Permission groups by role
export const ROLE_PERMISSIONS = {
  // Inventory permissions
  INVENTORY_READ: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF],
  INVENTORY_WRITE: [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  INVENTORY_DELETE: [USER_ROLES.ADMIN],
  INVENTORY_LOW_STOCK: [USER_ROLES.ADMIN, USER_ROLES.MANAGER],

  // User management permissions
  USER_MANAGEMENT: [USER_ROLES.ADMIN],
  USER_APPROVAL: [USER_ROLES.ADMIN],

  // Sales permissions
  SALES_READ: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF],
  SALES_WRITE: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF],

  // POS permissions
  POS_ACCESS: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF],

  // Reports permissions
  REPORTS_READ: [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  REPORTS_ADVANCED: [USER_ROLES.ADMIN], // Removed MANAGER - financial reports only for Admin
  INVENTORY_REPORTS: [USER_ROLES.ADMIN, USER_ROLES.MANAGER], // Non-financial inventory reports
  SALES_VOLUME_REPORTS: [USER_ROLES.ADMIN, USER_ROLES.MANAGER], // Volume only, not profit

  // Settings permissions
  SETTINGS_ACCESS: [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  SETTINGS_ADVANCED: [USER_ROLES.ADMIN],

  // Finance permissions - GRANULAR CONTROL
  FINANCE_TRANSACTIONS_CREATE: [USER_ROLES.ADMIN, USER_ROLES.MANAGER], // Can record income/expenses
  FINANCE_TRANSACTIONS_READ: [USER_ROLES.ADMIN, USER_ROLES.MANAGER], // Can view their own transactions
  FINANCE_APPROVE: [USER_ROLES.ADMIN], // Only Admin can approve
  FINANCE_DELETE: [USER_ROLES.ADMIN], // Only Admin can delete

  // Financial analytics and strategic data - ADMIN ONLY
  FINANCIAL_ANALYTICS: [USER_ROLES.ADMIN], // Profit margins, ROI, financial strength
  FINANCIAL_REPORTS: [USER_ROLES.ADMIN], // Income statements, cash flow, P&L
  PRODUCT_COST_READ: [USER_ROLES.ADMIN], // Cost prices, profit margins per product
  PRODUCT_PRICE_READ: [USER_ROLES.ADMIN], // Selling prices and pricing information
  REVENUE_READ: [USER_ROLES.ADMIN], // Total sales revenue and financial totals
  FINANCIAL_AGGREGATES: [USER_ROLES.ADMIN], // Total business financial data
  
  // Customer data permissions
  CUSTOMER_PERSONAL_DATA: [USER_ROLES.ADMIN, USER_ROLES.MANAGER], // Contact details, history
  CUSTOMER_ANALYTICS: [USER_ROLES.ADMIN], // Spending patterns, lifetime value

  // Business intelligence permissions
  SUPPLIER_CONTRACTS: [USER_ROLES.ADMIN], // Supplier pricing and terms
  BUSINESS_ANALYTICS: [USER_ROLES.ADMIN], // Strategic business metrics
  COMPETITIVE_DATA: [USER_ROLES.ADMIN], // Market positioning data

  // System security permissions
  AUDIT_LOGS: [USER_ROLES.ADMIN], // System audit trails
  SYSTEM_CONFIG: [USER_ROLES.ADMIN], // System configuration
  USER_ACTIVITY: [USER_ROLES.ADMIN], // User activity monitoring
};

/**
 * Check if a user role is included in the allowed roles
 */
export const hasRole = (
  userRole: string | undefined | null,
  allowedRoles: UserRole[]
): boolean => {
  if (!userRole) return false;

  // Safe type check
  return allowedRoles.some(role => role === userRole);
};

/**
 * Check if a user has a specific permission
 */
export const hasPermission = (
  userRole: string | undefined | null,
  permission: keyof typeof ROLE_PERMISSIONS
): boolean => {
  if (!userRole) return false;
  const allowedRoles = ROLE_PERMISSIONS[permission];

  // Safe type check
  return allowedRoles.some(role => role === userRole);
};

/**
 * Check if a user has the Admin role
 */
export const isAdmin = (userRole: string | undefined | null): boolean => {
  return userRole === USER_ROLES.ADMIN;
};

/**
 * Check if a user has the Manager role
 */
export const isManager = (userRole: string | undefined | null): boolean => {
  return userRole === USER_ROLES.MANAGER;
};

/**
 * Check if a user has the Staff role
 */
export const isStaff = (userRole: string | undefined | null): boolean => {
  return userRole === USER_ROLES.STAFF;
};

/**
 * Check if a user can manage inventory
 */
export const canManageInventory = (
  userRole: string | undefined | null
): boolean => {
  return hasPermission(userRole, 'INVENTORY_WRITE');
};

/**
 * Check if a user can delete inventory items
 */
export const canDeleteInventory = (
  userRole: string | undefined | null
): boolean => {
  return hasPermission(userRole, 'INVENTORY_DELETE');
};

/**
 * Check if a user can manage other users
 */
export const canManageUsers = (
  userRole: string | undefined | null
): boolean => {
  return hasPermission(userRole, 'USER_MANAGEMENT');
};

/**
 * Check if a user can access the POS system
 */
export const canAccessPOS = (userRole: string | undefined | null): boolean => {
  return hasPermission(userRole, 'POS_ACCESS');
};

/**
 * Check if a user can access reports
 */
export const canAccessReports = (
  userRole: string | undefined | null
): boolean => {
  return hasPermission(userRole, 'REPORTS_READ');
};

/**
 * Check if a user can access settings
 */
export const canAccessSettings = (
  userRole: string | undefined | null
): boolean => {
  return hasPermission(userRole, 'SETTINGS_ACCESS');
};

/**
 * Check if a user can view low stock products
 */
export const canViewLowStock = (
  userRole: string | undefined | null
): boolean => {
  return hasPermission(userRole, 'INVENTORY_LOW_STOCK');
};

/**
 * Check if a user can read financial transaction data
 */
export const canReadFinance = (
  userRole: string | undefined | null
): boolean => {
  return hasPermission(userRole, 'FINANCE_TRANSACTIONS_READ');
};

/**
 * Check if a user can write financial transaction data
 */
export const canWriteFinance = (
  userRole: string | undefined | null
): boolean => {
  return hasPermission(userRole, 'FINANCE_TRANSACTIONS_CREATE');
};

/**
 * Check if a user can approve finance transactions
 */
export const canApproveFinance = (
  userRole: string | undefined | null
): boolean => {
  return hasPermission(userRole, 'FINANCE_APPROVE');
};

/**
 * Check if a user can delete finance transactions
 */
export const canDeleteFinance = (
  userRole: string | undefined | null
): boolean => {
  return hasPermission(userRole, 'FINANCE_DELETE');
};

/**
 * Determine if a user has access to a specific route based on their role
 */
export const authorizeUserForRoute = (
  userRole: string | undefined | null,
  route: string
): boolean => {
  if (!userRole) return false;

  // Admin has access to all routes
  if (userRole === USER_ROLES.ADMIN) return true;

  // Route-based authorization
  if (route.startsWith('/admin')) {
    return userRole === USER_ROLES.ADMIN;
  }

  if (route.startsWith('/reports') || route.startsWith('/settings')) {
    return userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.MANAGER;
  }

  if (route.startsWith('/pos')) {
    return hasPermission(userRole, 'POS_ACCESS');
  }

  // Default routes (dashboard, inventory) accessible to all roles
  return true;
};
