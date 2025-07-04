import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface UseUserStatusValidationOptions {
  redirectOnApproved?: boolean;
  autoRefresh?: boolean;
  pollInterval?: number;
}

interface UserStatusValidationResult {
  userStatus: string | null;
  isRefreshing: boolean;
  hasTriedRefresh: boolean;
  refreshUserStatus: () => Promise<void>;
  isLoading: boolean;
}

/**
 * Hook for managing user status validation and session management
 * Handles complex session validation, auto-refresh, and routing logic
 */
export function useUserStatusValidation(
  options: UseUserStatusValidationOptions = {}
): UserStatusValidationResult {
  const {
    redirectOnApproved = true,
    autoRefresh = true,
    pollInterval,
  } = options;

  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasTriedRefresh, setHasTriedRefresh] = useState(false);

  // Function to refresh user status from the server
  const refreshUserStatus = useCallback(async () => {
    if (!session?.user?.id) return;

    setIsRefreshing(true);
    setHasTriedRefresh(true);

    try {
      // Use NextAuth's update() to trigger a fresh JWT token fetch
      await update();
    } catch (error) {
      console.error("Error refreshing session:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [session, update]);

  // Update user status when session changes
  useEffect(() => {
    if (session?.user?.status) {
      setUserStatus(session.user.status);
    } else if (session === null) {
      // Session is explicitly null (unauthenticated)
      setUserStatus(null);
    }
    // Session is undefined (still loading) or has no status - do nothing
  }, [session]);

  // Automatically refresh session if user status is unknown or seems stale
  useEffect(() => {
    if (!autoRefresh) return;

    if (session && !hasTriedRefresh) {
      const shouldAutoRefresh =
        !userStatus || // No status detected
        userStatus === "undefined" || // Status is string "undefined"
        (userStatus === "PENDING" &&
          sessionStorage.getItem("emailJustVerified")); // User just verified email but still shows PENDING

      if (shouldAutoRefresh) {
        refreshUserStatus();

        // Clear the flag after attempting refresh
        if (sessionStorage.getItem("emailJustVerified")) {
          sessionStorage.removeItem("emailJustVerified");
        }
      }
    }
  }, [session, userStatus, hasTriedRefresh, refreshUserStatus, autoRefresh]);

  // Redirect if user is already approved
  useEffect(() => {
    if (redirectOnApproved && userStatus === "APPROVED") {
      router.push("/dashboard");
    }
  }, [userStatus, router, redirectOnApproved]);

  // Optional polling for status changes
  useEffect(() => {
    if (!pollInterval || !session?.user?.id) return;

    const interval = setInterval(() => {
      refreshUserStatus();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval, session?.user?.id, refreshUserStatus]);

  return {
    userStatus,
    isRefreshing,
    hasTriedRefresh,
    refreshUserStatus,
    isLoading: status === "loading",
  };
}
