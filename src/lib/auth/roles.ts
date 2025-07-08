/**
 * Central Role Management System
 * This file is the single source of truth for all role definitions in the application.
 * All role-related code should import from this file to ensure consistency.
 */

// Define the exact role names as string literals (UPPER_CASE for constants)
export const USER_ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
} as const;

// Type for user roles based on the USER_ROLES object
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Array of all valid roles for validation purposes
export const ALL_ROLES = Object.values(USER_ROLES);

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [USER_ROLES.EMPLOYEE]: 1,
  [USER_ROLES.MANAGER]: 2,
  [USER_ROLES.ADMIN]: 3,
};

// Role display names for UI presentation
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [USER_ROLES.ADMIN]: "Administrator",
  [USER_ROLES.MANAGER]: "Manager",
  [USER_ROLES.EMPLOYEE]: "Employee",
};

// Role descriptions for documentation and UI
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [USER_ROLES.ADMIN]: "Full access to all system features and user management",
  [USER_ROLES.MANAGER]:
    "Can manage inventory, view reports, and handle day-to-day operations",
  [USER_ROLES.EMPLOYEE]:
    "Can view inventory, process sales, and access basic reports",
};

// Permission groups by role
export const ROLE_PERMISSIONS = {
  // Inventory permissions
  INVENTORY_READ: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.EMPLOYEE],
  INVENTORY_WRITE: [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  INVENTORY_DELETE: [USER_ROLES.ADMIN],
  INVENTORY_LOW_STOCK: [USER_ROLES.ADMIN, USER_ROLES.MANAGER],

  // User management permissions
  USER_MANAGEMENT: [USER_ROLES.ADMIN],
  USER_APPROVAL: [USER_ROLES.ADMIN],

  // Sales permissions
  SALES_READ: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.EMPLOYEE],
  SALES_WRITE: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.EMPLOYEE],

  // POS permissions
  POS_ACCESS: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.EMPLOYEE],

  // Reports permissions
  REPORTS_READ: [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  REPORTS_ADVANCED: [USER_ROLES.ADMIN, USER_ROLES.MANAGER],

  // Settings permissions
  SETTINGS_ACCESS: [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  SETTINGS_ADVANCED: [USER_ROLES.ADMIN],
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
  return allowedRoles.some((role) => role === userRole);
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
  return allowedRoles.some((role) => role === userRole);
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
 * Check if a user has the Employee role
 */
export const isEmployee = (userRole: string | undefined | null): boolean => {
  return userRole === USER_ROLES.EMPLOYEE;
};

/**
 * Check if a user can manage inventory
 */
export const canManageInventory = (
  userRole: string | undefined | null
): boolean => {
  return hasPermission(userRole, "INVENTORY_WRITE");
};

/**
 * Check if a user can delete inventory items
 */
export const canDeleteInventory = (
  userRole: string | undefined | null
): boolean => {
  return hasPermission(userRole, "INVENTORY_DELETE");
};

/**
 * Check if a user can manage other users
 */
export const canManageUsers = (
  userRole: string | undefined | null
): boolean => {
  return hasPermission(userRole, "USER_MANAGEMENT");
};

/**
 * Check if a user can access the POS system
 */
export const canAccessPOS = (userRole: string | undefined | null): boolean => {
  return hasPermission(userRole, "POS_ACCESS");
};

/**
 * Check if a user can access reports
 */
export const canAccessReports = (
  userRole: string | undefined | null
): boolean => {
  return hasPermission(userRole, "REPORTS_READ");
};

/**
 * Check if a user can access settings
 */
export const canAccessSettings = (
  userRole: string | undefined | null
): boolean => {
  return hasPermission(userRole, "SETTINGS_ACCESS");
};

/**
 * Check if a user can view low stock products
 */
export const canViewLowStock = (
  userRole: string | undefined | null
): boolean => {
  return hasPermission(userRole, "INVENTORY_LOW_STOCK");
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
  if (route.startsWith("/admin")) {
    return userRole === USER_ROLES.ADMIN;
  }

  if (route.startsWith("/reports") || route.startsWith("/settings")) {
    return userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.MANAGER;
  }

  if (route.startsWith("/pos")) {
    return hasPermission(userRole, "POS_ACCESS");
  }

  // Default routes (dashboard, inventory) accessible to all roles
  return true;
};
