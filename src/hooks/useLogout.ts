"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

interface LogoutOptions {
  redirect?: boolean;
  callbackUrl?: string;
}

interface UseLogoutReturn {
  logout: (options?: LogoutOptions) => Promise<void>;
  isLoading: boolean;
}

/**
 * Custom hook for handling logout functionality
 * Uses official Auth.js v5 signOut function
 */
export function useLogout(): UseLogoutReturn {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const logout = useCallback(
    async (options: LogoutOptions = {}) => {
      const { redirect = true, callbackUrl = "/login" } = options;

      setIsLoading(true);

      try {
        if (redirect) {
          await signOut({
            callbackUrl,
            redirect: true,
          });
        } else {
          await signOut({
            redirect: false,
          });

          // Manual redirect after signOut
          router.push(callbackUrl);
        }
      } catch (error) {
        console.error("Logout error:", error);
        // Fallback redirect on error
        router.push(callbackUrl);
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  return {
    logout,
    isLoading,
  };
}

// Export alias for backward compatibility
export const useSignOut = useLogout;
