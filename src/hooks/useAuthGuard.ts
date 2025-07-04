import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

interface UseAuthGuardOptions {
  requiredRole?: "ADMIN" | "USER";
  redirectTo?: string;
  allowedStatuses?: string[];
}

interface AuthGuardResult {
  isAuthenticated: boolean;
  isAuthorized: boolean;
  user: any;
  session: any;
  isLoading: boolean;
}

/**
 * Hook for protecting routes with authentication and authorization
 * Automatically redirects unauthorized users
 */
export function useAuthGuard(
  options: UseAuthGuardOptions = {}
): AuthGuardResult {
  const {
    requiredRole,
    redirectTo = "/unauthorized",
    allowedStatuses = ["APPROVED"],
  } = options;

  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading = status === "loading";
  const isAuthenticated = !!session?.user;

  const hasRequiredRole = requiredRole
    ? session?.user?.role === requiredRole
    : true;

  const hasAllowedStatus = session?.user?.status
    ? allowedStatuses.includes(session.user.status)
    : false;

  const isAuthorized = isAuthenticated && hasRequiredRole && hasAllowedStatus;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!isAuthorized) {
      router.push(redirectTo);
      return;
    }
  }, [isAuthenticated, isAuthorized, isLoading, router, redirectTo]);

  return {
    isAuthenticated,
    isAuthorized,
    user: session?.user,
    session,
    isLoading,
  };
}
