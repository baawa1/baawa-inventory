import { useCallback, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UseLogoutOptions {
  callbackUrl?: string;
  redirect?: boolean;
}

export function useLogout(options: UseLogoutOptions = {}) {
  const { callbackUrl = "/login", redirect = true } = options;
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);

    try {
      // Clear any client-side storage
      sessionStorage.clear();
      localStorage.clear();

      // Call our logout API to clear cookies
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch (apiError) {
        console.warn("Logout API call failed:", apiError);
      }

      // Sign out using NextAuth
      await signOut({
        callbackUrl,
        redirect,
      });

      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);

      // Fallback: clear storage and redirect manually
      sessionStorage.clear();
      localStorage.clear();

      if (redirect) {
        router.push(callbackUrl);
      }

      return { success: false, error };
    } finally {
      setIsLoggingOut(false);
    }
  }, [callbackUrl, redirect, router]);

  return {
    logout,
    isLoggingOut,
    isLoggedIn: !!session,
    session,
  };
}
