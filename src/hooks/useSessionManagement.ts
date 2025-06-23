"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useCallback } from "react";
import {
  SessionTimeoutManager,
  secureLogout,
  checkSessionValidity,
} from "@/lib/session-management";

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

  // Session validity check
  const checkSession = useCallback(async () => {
    if (status === "authenticated" && session) {
      const sessionInfo = await checkSessionValidity();

      if (!sessionInfo.isValid) {
        await secureLogout();
        return false;
      }

      return true;
    }
    return false;
  }, [session, status]);

  // Initialize session timeout manager
  useEffect(() => {
    if (status === "authenticated" && enableTimeoutWarning) {
      timeoutManagerRef.current = new SessionTimeoutManager(
        onSessionWarning,
        onSessionTimeout
      );

      timeoutManagerRef.current.startMonitoring();

      return () => {
        timeoutManagerRef.current?.destroy();
      };
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

    // Periodic session check
    const startPeriodicCheck = () => {
      if (activityTimeoutRef.current) {
        clearInterval(activityTimeoutRef.current);
      }

      activityTimeoutRef.current = setInterval(
        checkSession,
        activityCheckInterval
      );
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

  // Handle browser visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        status === "authenticated"
      ) {
        // Check session when tab becomes visible
        checkSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkSession, status]);

  return {
    session,
    status,
    isAuthenticated: status === "authenticated",
    checkSession,
    logout: secureLogout,
  };
}
