/**
 * CSRF Token Hook
 * Manages CSRF tokens for forms and API requests
 */

import { useState, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';

export function useCSRF() {
  const { data: session } = useSession();
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  // Get CSRF token from cookie - reactive function
  const getCSRFToken = useCallback(() => {
    if (typeof document === 'undefined') return null;

    const cookies = document.cookie.split(';');
    const csrfCookie = cookies.find(cookie =>
      cookie.trim().startsWith('csrf-token=')
    );
    return csrfCookie ? csrfCookie.split('=')[1] : null;
  }, []);

  // Update token when session changes
  const updateToken = useCallback(() => {
    if (session?.user) {
      const token = getCSRFToken();
      setCsrfToken(token);
    } else {
      setCsrfToken(null);
    }
  }, [session?.user, getCSRFToken]);

  // Memoized headers to avoid unnecessary re-renders
  const csrfHeaders = useMemo((): Record<string, string> => {
    const token = csrfToken || getCSRFToken();
    if (!token) return {};

    return {
      'X-CSRF-Token': token,
      'Content-Type': 'application/json',
    };
  }, [csrfToken, getCSRFToken]);

  // Fetch with CSRF headers
  const fetchWithCSRF = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = {
        ...csrfHeaders,
        ...(options.headers as Record<string, string>),
      };

      return fetch(url, {
        ...options,
        headers,
      });
    },
    [csrfHeaders]
  );

  // Update token on mount and when session changes
  if (session?.user && !csrfToken) {
    updateToken();
  } else if (!session?.user && csrfToken) {
    updateToken();
  }

  return {
    csrfToken: csrfToken || getCSRFToken(),
    isLoading: false, // No longer need loading state since we read synchronously
    getCSRFHeaders: () => csrfHeaders,
    fetchWithCSRF,
    refreshToken: updateToken,
  };
}
