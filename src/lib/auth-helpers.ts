import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { UserRole, getRolePermissions, RolePermissions } from "./auth-rbac";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

export async function requireRole(requiredRole: UserRole | UserRole[]) {
  const user = await requireAuth();
  const userRole = user.role as UserRole;

  // Admin always has access
  if (userRole === "ADMIN") {
    return user;
  }

  const allowedRoles = Array.isArray(requiredRole)
    ? requiredRole
    : [requiredRole];

  if (!allowedRoles.includes(userRole)) {
    throw new Error(`Role ${allowedRoles.join(" or ")} required`);
  }

  return user;
}

export async function requirePermission(permission: keyof RolePermissions) {
  const user = await requireAuth();
  const userRole = user.role as UserRole;
  const permissions = getRolePermissions(userRole);

  if (!permissions[permission]) {
    throw new Error(`Permission ${permission} required`);
  }

  return user;
}

export async function hasRole(role: UserRole): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const userRole = user.role as UserRole;
    return userRole === "ADMIN" || userRole === role;
  } catch {
    return false;
  }
}

export async function hasPermission(
  permission: keyof RolePermissions
): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const userRole = user.role as UserRole;
    const permissions = getRolePermissions(userRole);
    return permissions[permission];
  } catch {
    return false;
  }
}
