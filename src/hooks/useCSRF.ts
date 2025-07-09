/**
 * CSRF Token Hook
 * Manages CSRF tokens for forms and API requests
 */

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export function useCSRF() {
  const { data: session } = useSession();
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      // Get CSRF token from cookie
      const getCSRFToken = () => {
        const cookies = document.cookie.split(";");
        const csrfCookie = cookies.find((cookie) =>
          cookie.trim().startsWith("csrf-token=")
        );
        return csrfCookie ? csrfCookie.split("=")[1] : null;
      };

      const token = getCSRFToken();
      setCsrfToken(token);
      setIsLoading(false);
    } else {
      setCsrfToken(null);
      setIsLoading(false);
    }
  }, [session]);

  const getCSRFHeaders = (): Record<string, string> => {
    if (!csrfToken) return {};

    return {
      "X-CSRF-Token": csrfToken,
      "Content-Type": "application/json",
    };
  };

  const fetchWithCSRF = async (url: string, options: RequestInit = {}) => {
    const csrfHeaders = getCSRFHeaders();
    const headers = {
      ...csrfHeaders,
      ...(options.headers as Record<string, string>),
    };

    return fetch(url, {
      ...options,
      headers,
    });
  };

  return {
    csrfToken,
    isLoading,
    getCSRFHeaders,
    fetchWithCSRF,
  };
}
