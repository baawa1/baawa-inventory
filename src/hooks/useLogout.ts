'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

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
 * Uses official Auth.js v5 signOut function with fallback error handling
 */
export function useLogout(): UseLogoutReturn {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const logout = useCallback(
    async (options: LogoutOptions = {}) => {
      const { redirect = true, callbackUrl = '/login' } = options;

      setIsLoading(true);

      try {
        // Clear local storage first
        if (typeof window !== 'undefined') {
          localStorage.removeItem('inventory-cart');
          localStorage.removeItem('pos-session');
          sessionStorage.clear();
        }

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
        logger.error('Logout failed', {
          error: error instanceof Error ? error.message : String(error),
        });
        toast.error('Logout failed. Please try again.');

        // Handle the specific NextAuth ClientFetchError
        if (error && typeof error === 'object' && 'message' in error) {
          // Debug logging removed for production
        }

        // Fallback: Force logout by clearing everything and redirecting
        if (typeof window !== 'undefined') {
          // Clear all possible auth-related data
          localStorage.clear();
          sessionStorage.clear();

          // Clear NextAuth cookies manually
          const cookies = [
            'next-auth.session-token',
            'next-auth.csrf-token',
            'next-auth.callback-url',
            '__Secure-next-auth.session-token',
            '__Secure-next-auth.csrf-token',
          ];

          cookies.forEach(cookieName => {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;`;
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
          });

          // Force a hard redirect to ensure session is cleared
          window.location.href = callbackUrl;
        } else {
          // Fallback for server-side
          router.push(callbackUrl);
        }
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
