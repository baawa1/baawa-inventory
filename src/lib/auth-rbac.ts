import type { UserRole } from '@/types/user';

// Role permissions mapping
const rolePermissions: Record<UserRole, string[]> = {
  ADMIN: [
    'users:read',
    'users:write',
    'users:delete',
    'inventory:read',
    'inventory:write',
    'inventory:delete',
    'reports:read',
    'reports:write',
    'settings:read',
    'settings:write',
    'audit:read',
    'pos:read',
    'pos:write',
  ],
  MANAGER: [
    'users:read',
    'inventory:read',
    'inventory:write',
    'reports:read',
    'reports:write',
    'settings:read',
    'pos:read',
    'pos:write',
  ],
  STAFF: [
    'inventory:read',
    'inventory:write',
    'reports:read',
    'pos:read',
    'pos:write',
  ],
};

/**
 * Get permissions for a specific role (Server-side safe)
 */
export function getRolePermissions(role: UserRole): string[] {
  return rolePermissions[role] || [];
}

/**
 * Check if a role has a specific permission (Server-side safe)
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions (Server-side safe)
 */
export function hasAnyPermission(
  role: UserRole,
  permissions: string[]
): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions (Server-side safe)
 */
export function hasAllPermissions(
  role: UserRole,
  permissions: string[]
): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all available permissions (Server-side safe)
 */
export function getAllPermissions(): string[] {
  return Object.values(rolePermissions).flat();
}

/**
 * Get all available roles (Server-side safe)
 */
export function getAvailableRoles(): UserRole[] {
  return Object.keys(rolePermissions) as UserRole[];
}
