"use client";

import { useSession } from "next-auth/react";
import type { UserRole } from "@/types/user";
import { getRolePermissions } from "./auth-rbac";

/**
 * Custom hook for role-based access control using Auth.js v5
 */
export const useAuth = () => {
  const { data: session, status } = useSession();

  const user = session?.user;
  const role = user?.role as UserRole;
  const permissions = role ? getRolePermissions(role) : null;

  return {
    user,
    role,
    permissions,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated" && !!session,
  };
};
