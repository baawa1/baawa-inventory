"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { UserRole } from "@/types/user";

interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    emailVerified: boolean;
  };
}

interface UseAuthGuardOptions {
  redirectTo?: string;
  requireRole?: UserRole | UserRole[];
  requireActiveStatus?: boolean;
}

interface UseAuthGuardReturn {
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuthGuard(
  options: UseAuthGuardOptions = {}
): UseAuthGuardReturn {
  const {
    redirectTo = "/login",
    requireRole,
    requireActiveStatus = true,
  } = options;

  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated" || !session?.user) {
      router.push(redirectTo);
      return;
    }

    // Check status requirement
    if (requireActiveStatus && session.user.status !== "APPROVED") {
      setError("Account not active");
      router.push("/pending-approval");
      return;
    }

    // Check role requirement
    if (requireRole) {
      const allowedRoles = Array.isArray(requireRole)
        ? requireRole
        : [requireRole];
      if (!allowedRoles.includes(session.user.role as UserRole)) {
        setError("Insufficient permissions");
        router.push("/unauthorized");
        return;
      }
    }

    setError(null);
  }, [session, status, redirectTo, requireRole, requireActiveStatus, router]);

  return {
    session: session as AuthSession | null,
    isLoading: status === "loading",
    error,
  };
}

// Convenience hooks for common use cases
export function useRequireAuth(redirectTo?: string) {
  return useAuthGuard({ redirectTo });
}

export function useRequireRole(
  role: UserRole | UserRole[],
  redirectTo?: string
) {
  return useAuthGuard({ requireRole: role, redirectTo });
}

export function useRequireAdmin(redirectTo?: string) {
  return useAuthGuard({ requireRole: "ADMIN", redirectTo });
}

export function useRequireManager(redirectTo?: string) {
  return useAuthGuard({ requireRole: ["ADMIN", "MANAGER"], redirectTo });
}
