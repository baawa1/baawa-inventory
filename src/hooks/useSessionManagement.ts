"use client";

import { useSession, getSession } from "next-auth/react";
import { useEffect, useRef, useCallback } from "react";
import {
  SessionTimeoutManager,
  secureLogout,
  checkSessionValidity,
} from "../lib/session-management";

interface UseSessionManagementOptions {
  enableActivityTracking?: boolean;
  enableTimeoutWarning?: boolean;
  onSessionWarning?: () => void;
  onSessionTimeout?: () => void;
  activityCheckInterval?: number; // in milliseconds
}

export function useSessionManagement({
  enableActivityTracking = true,
  enableTimeoutWarning = true,
  onSessionWarning,
  onSessionTimeout,
  activityCheckInterval = 30000, // 30 seconds
}: UseSessionManagementOptions = {}) {
  const { data: session, status } = useSession();
  const timeoutManagerRef = useRef<SessionTimeoutManager | null>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Session validity check with error recovery
  const checkSession = useCallback(async () => {
    try {
      if (status === "authenticated" && session) {
        const sessionInfo = await checkSessionValidity();

        if (!sessionInfo.isValid) {
          await secureLogout();
          return false;
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error("Session check failed:", error);
      // On error, don't immediately logout but return false to indicate check failed
      // Allow retry on next check cycle
      return false;
    }
  }, [session, status]);

  // Initialize session timeout manager with error handling
  useEffect(() => {
    if (status === "authenticated" && enableTimeoutWarning) {
      try {
        timeoutManagerRef.current = new SessionTimeoutManager(
          onSessionWarning,
          onSessionTimeout
        );

        timeoutManagerRef.current.startMonitoring();

        return () => {
          try {
            timeoutManagerRef.current?.destroy();
          } catch (error) {
            console.error("Error destroying session timeout manager:", error);
          }
        };
      } catch (error) {
        console.error("Error initializing session timeout manager:", error);
        // Continue without timeout manager if initialization fails
      }
    }
  }, [status, enableTimeoutWarning, onSessionWarning, onSessionTimeout]);

  // Activity tracking
  useEffect(() => {
    if (!enableActivityTracking || status !== "authenticated") return;

    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];
    let lastActivity = Date.now();

    const handleActivity = () => {
      const now = Date.now();

      // Only reset timeout if it's been more than 1 minute since last reset
      if (now - lastActivity > 60000) {
        lastActivity = now;
        timeoutManagerRef.current?.resetTimeout();
      }
    };

    // Add event listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Periodic session check with error recovery
    const startPeriodicCheck = () => {
      if (activityTimeoutRef.current) {
        clearInterval(activityTimeoutRef.current);
      }

      activityTimeoutRef.current = setInterval(async () => {
        try {
          const isValid = await checkSession();
          if (!isValid && status === "authenticated") {
            // Session is invalid, but we're still marked as authenticated
            // This indicates a session validation failure, attempt recovery
            console.warn("Session validation failed, attempting recovery");

            // Try to get fresh session data
            const freshSession = await getSession();
            if (!freshSession) {
              // No session found, logout
              await secureLogout();
            }
          }
        } catch (error) {
          console.error("Periodic session check failed:", error);
          // Continue checking - don't break the interval on errors
        }
      }, activityCheckInterval);
    };

    startPeriodicCheck();

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });

      if (activityTimeoutRef.current) {
        clearInterval(activityTimeoutRef.current);
      }
    };
  }, [enableActivityTracking, status, activityCheckInterval, checkSession]);

  // Handle browser visibility change with error handling
  useEffect(() => {
    const handleVisibilityChange = async () => {
      try {
        if (
          document.visibilityState === "visible" &&
          status === "authenticated"
        ) {
          // Check session when tab becomes visible
          await checkSession();
        }
      } catch (error) {
        console.error("Error during visibility change session check:", error);
        // Don't fail silently - continue operating
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkSession, status]);

  // Manual session recovery function
  const recoverSession = useCallback(async (): Promise<boolean> => {
    try {
      const freshSession = await getSession();
      if (freshSession) {
        // Reset timeout manager if active
        timeoutManagerRef.current?.resetTimeout();
        return true;
      } else {
        // No valid session found, logout
        await secureLogout();
        return false;
      }
    } catch (error) {
      console.error("Session recovery failed:", error);
      return false;
    }
  }, []);

  return {
    session,
    status,
    isAuthenticated: status === "authenticated",
    checkSession,
    recoverSession,
    logout: secureLogout,
  };
}
