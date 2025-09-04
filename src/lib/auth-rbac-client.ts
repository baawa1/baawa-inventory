'use client';

import { useSession } from 'next-auth/react';
import type { UserRole } from '@/types/user';
import { hasPermission, ROLE_PERMISSIONS } from './auth/roles';

/**
 * Custom hook for role-based access control using Auth.js v5
 */
export const useAuth = () => {
  const { data: session, status } = useSession();

  const user = session?.user;
  const role = user?.role as UserRole;

  // Helper function to check permissions
  const checkPermission = (permission: keyof typeof ROLE_PERMISSIONS) => {
    return role ? hasPermission(role, permission) : false;
  };

  // Get all permissions for the role (for backward compatibility)
  const permissions = role ? Object.keys(ROLE_PERMISSIONS).filter(permission => 
    hasPermission(role, permission as keyof typeof ROLE_PERMISSIONS)
  ) : null;

  return {
    user,
    role,
    permissions,
    checkPermission,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated' && !!session,
  };
};
