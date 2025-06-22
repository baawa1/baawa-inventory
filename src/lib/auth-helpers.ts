import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";

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

export async function requireRole(requiredRole: string) {
  const user = await requireAuth();
  if (user.role !== requiredRole && user.role !== "ADMIN") {
    throw new Error(`Role ${requiredRole} required`);
  }
  return user;
}
