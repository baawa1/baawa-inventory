/**
 * Centralized role management system
 * This file defines all user roles and permissions to prevent inconsistencies
 */

import {
  USER_STATUS,
  POS_ALLOWED_STATUSES,
  type UserStatus,
} from "./constants";

// Define the exact role names used in the database
export const USER_ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
} as const;

// Type for user roles
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Array of all valid roles
export const ALL_ROLES: UserRole[] = Object.values(USER_ROLES);

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [USER_ROLES.STAFF]: 1,
  [USER_ROLES.MANAGER]: 2,
  [USER_ROLES.ADMIN]: 3,
};

// Permission groups
export const PERMISSIONS = {
  // Inventory permissions
  INVENTORY_READ: [
    USER_ROLES.ADMIN,
    USER_ROLES.MANAGER,
    USER_ROLES.STAFF,
  ] as UserRole[],
  INVENTORY_WRITE: [USER_ROLES.ADMIN, USER_ROLES.MANAGER] as UserRole[],
  INVENTORY_DELETE: [USER_ROLES.ADMIN] as UserRole[],

  // Low stock and reorder permissions
  LOW_STOCK_READ: [
    USER_ROLES.ADMIN,
    USER_ROLES.MANAGER,
    USER_ROLES.STAFF,
  ] as UserRole[],

  // User management permissions
  USER_MANAGEMENT: [USER_ROLES.ADMIN] as UserRole[],
  USER_APPROVAL: [USER_ROLES.ADMIN] as UserRole[],

  // Sales permissions
  SALES_READ: [
    USER_ROLES.ADMIN,
    USER_ROLES.MANAGER,
    USER_ROLES.STAFF,
  ] as UserRole[],
  SALES_WRITE: [
    USER_ROLES.ADMIN,
    USER_ROLES.MANAGER,
    USER_ROLES.STAFF,
  ] as UserRole[],

  // POS permissions
  POS_ACCESS: [
    USER_ROLES.ADMIN,
    USER_ROLES.MANAGER,
    USER_ROLES.STAFF,
  ] as UserRole[],

  // Reports permissions
  REPORTS_READ: [
    USER_ROLES.ADMIN,
    USER_ROLES.MANAGER,
    USER_ROLES.STAFF,
  ] as UserRole[],
  REPORTS_ADVANCED: [USER_ROLES.ADMIN, USER_ROLES.MANAGER] as UserRole[],
} as const;

// Helper functions
export const hasRole = (
  userRole: string | undefined,
  allowedRoles: UserRole[]
): boolean => {
  if (!userRole) return false;
  return allowedRoles.includes(userRole as UserRole);
};

export const hasPermission = (
  userRole: string | undefined,
  permission: keyof typeof PERMISSIONS
): boolean => {
  if (!userRole) return false;
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(userRole as UserRole);
};

export const isAdmin = (userRole: string | undefined): boolean => {
  return userRole === USER_ROLES.ADMIN;
};

export const isManager = (userRole: string | undefined): boolean => {
  return userRole === USER_ROLES.MANAGER;
};

export const isStaff = (userRole: string | undefined): boolean => {
  return userRole === USER_ROLES.STAFF;
};

export const canManageInventory = (userRole: string | undefined): boolean => {
  return hasPermission(userRole, "INVENTORY_WRITE");
};

export const canDeleteInventory = (userRole: string | undefined): boolean => {
  return hasPermission(userRole, "INVENTORY_DELETE");
};

export const canManageUsers = (userRole: string | undefined): boolean => {
  return hasPermission(userRole, "USER_MANAGEMENT");
};

export const canViewLowStock = (userRole: string | undefined): boolean => {
  return hasPermission(userRole, "LOW_STOCK_READ");
};

export const canAccessPOS = (userRole: string | undefined): boolean => {
  return hasPermission(userRole, "POS_ACCESS");
};

// Centralized user status validation
export const isUserStatusValid = (status: string | undefined): boolean => {
  if (!status) return false;
  return Object.values(USER_STATUS).includes(status as UserStatus);
};

export const canUserAccessPOS = (status: string | undefined): boolean => {
  if (!status) return false;
  return POS_ALLOWED_STATUSES.includes(status as UserStatus);
};

// Centralized authentication check
export const isUserAuthorizedForPOS = (
  role: string | undefined,
  status: string | undefined
): { authorized: boolean; reason?: string } => {
  // Check if role has POS access permission
  if (!hasPermission(role, "POS_ACCESS")) {
    return {
      authorized: false,
      reason: "Insufficient permissions",
    };
  }

  // Check if user status allows POS access
  if (!canUserAccessPOS(status)) {
    return {
      authorized: false,
      reason: "Account not approved",
    };
  }

  return { authorized: true };
};

// Validate complete user authorization
export const validateUserAuthorization = (
  role: string | undefined,
  status: string | undefined,
  permission: keyof typeof PERMISSIONS
): { authorized: boolean; reason?: string } => {
  // Check role permission
  if (!hasPermission(role, permission)) {
    return {
      authorized: false,
      reason: "Insufficient permissions",
    };
  }

  // Check user status
  if (!canUserAccessPOS(status)) {
    return {
      authorized: false,
      reason: "Account not approved",
    };
  }

  return { authorized: true };
};

// Role display names
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [USER_ROLES.ADMIN]: "Administrator",
  [USER_ROLES.MANAGER]: "Manager",
  [USER_ROLES.STAFF]: "Staff",
};

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [USER_ROLES.ADMIN]: "Full access to all system features and user management",
  [USER_ROLES.MANAGER]:
    "Can manage inventory, view reports, and handle day-to-day operations",
  [USER_ROLES.STAFF]:
    "Can view inventory, process sales, and access basic reports",
};
