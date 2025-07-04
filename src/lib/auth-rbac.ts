import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export type UserRole = "ADMIN" | "MANAGER" | "EMPLOYEE";

export interface RolePermissions {
  canAccessAdmin: boolean;
  canAccessReports: boolean;
  canAccessSettings: boolean;
  canManageUsers: boolean;
  canManageSuppliers: boolean;
  canDeleteTransactions: boolean;
  canViewAllSales: boolean;
  canProcessRefunds: boolean;
}

export const getRolePermissions = (role: UserRole): RolePermissions => {
  const permissions: Record<UserRole, RolePermissions> = {
    ADMIN: {
      canAccessAdmin: true,
      canAccessReports: true,
      canAccessSettings: true,
      canManageUsers: true,
      canManageSuppliers: true,
      canDeleteTransactions: true,
      canViewAllSales: true,
      canProcessRefunds: true,
    },
    MANAGER: {
      canAccessAdmin: false,
      canAccessReports: true,
      canAccessSettings: true,
      canManageUsers: false,
      canManageSuppliers: true,
      canDeleteTransactions: true,
      canViewAllSales: true,
      canProcessRefunds: true,
    },
    EMPLOYEE: {
      canAccessAdmin: false,
      canAccessReports: false,
      canAccessSettings: false,
      canManageUsers: false,
      canManageSuppliers: false,
      canDeleteTransactions: false,
      canViewAllSales: false,
      canProcessRefunds: false,
    },
  };

  return permissions[role];
};

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
    isAuthenticated: !!session,
  };
};

export const useRequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && !isAuthenticated) {
    redirect("/auth/signin");
  }

  return useAuth();
};

export const useRequireRole = (requiredRole: UserRole | UserRole[]) => {
  const authData = useAuth();
  const { role, isLoading, isAuthenticated } = authData;

  if (!isLoading && !isAuthenticated) {
    redirect("/auth/signin");
  }

  if (!isLoading && isAuthenticated && role) {
    const allowedRoles = Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole];

    // Admin always has access
    if (role === "ADMIN") {
      return authData;
    }

    if (!allowedRoles.includes(role)) {
      redirect("/unauthorized");
    }
  }

  return authData;
};

export const useRequirePermission = (permission: keyof RolePermissions) => {
  const authData = useAuth();
  const { permissions, isLoading, isAuthenticated } = authData;

  if (!isLoading && !isAuthenticated) {
    redirect("/auth/signin");
  }

  if (
    !isLoading &&
    isAuthenticated &&
    permissions &&
    !permissions[permission]
  ) {
    redirect("/unauthorized");
  }

  return authData;
};
