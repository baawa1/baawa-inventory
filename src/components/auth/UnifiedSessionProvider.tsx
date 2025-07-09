/**
 * Unified Session Provider
 * Consolidates all session management functionality into a single provider
 */

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

interface SessionContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  extendSession: () => Promise<boolean>;
  checkSession: () => Promise<boolean>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface UnifiedSessionProviderProps {
  children: React.ReactNode;
  enableActivityTracking?: boolean;
  enableTimeoutWarning?: boolean;
  activityCheckInterval?: number;
}

export function UnifiedSessionProvider({
  children,
  enableActivityTracking = true,
  enableTimeoutWarning = true,
  activityCheckInterval = 30000,
}: UnifiedSessionProviderProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [warningId, setWarningId] = useState<NodeJS.Timeout | null>(null);
  const [activityId, setActivityId] = useState<NodeJS.Timeout | null>(null);

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  // Session timeout management
  const startSessionTimeout = useCallback(() => {
    if (!enableTimeoutWarning || !isAuthenticated) return;

    // Clear existing timeouts
    if (timeoutId) clearTimeout(timeoutId);
    if (warningId) clearTimeout(warningId);

    const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    const warningTime = 5 * 60 * 1000; // 5 minutes before expiry

    // Set warning timeout
    const warningTimeout = setTimeout(() => {
      setShowTimeoutWarning(true);
      setTimeLeft(300); // 5 minutes in seconds
    }, sessionTimeout - warningTime);

    // Set session timeout
    const sessionTimeoutId = setTimeout(() => {
      logger.session("Session expired, logging out user");
      handleLogout();
    }, sessionTimeout);

    setWarningId(warningTimeout);
    setTimeoutId(sessionTimeoutId);
  }, [enableTimeoutWarning, isAuthenticated, timeoutId, warningId]);

  // Activity tracking
  const startActivityTracking = useCallback(() => {
    if (!enableActivityTracking || !isAuthenticated) return;

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
      if (now - lastActivity > 60000) {
        // Only process if more than 1 minute since last activity
        lastActivity = now;
        startSessionTimeout(); // Reset timeout on activity
      }
    };

    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Periodic session check
    const periodicCheck = setInterval(async () => {
      try {
        // Simple session validation - check if session still exists
        if (!session) {
          logger.session("Session validation failed, logging out");
          await handleLogout();
        }
      } catch (error) {
        logger.error("Session validation error", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }, activityCheckInterval);

    setActivityId(periodicCheck);

    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      clearInterval(periodicCheck);
    };
  }, [enableActivityTracking, isAuthenticated, session, activityCheckInterval]);

  // Logout handler
  const handleLogout = useCallback(async () => {
    try {
      setShowTimeoutWarning(false);
      setTimeLeft(0);

      // Clear all timeouts
      if (timeoutId) clearTimeout(timeoutId);
      if (warningId) clearTimeout(warningId);
      if (activityId) clearInterval(activityId);

      logger.auth("User logging out");
      await signOut({ redirect: false });
      router.push("/login");
    } catch (error) {
      logger.error("Logout error", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [timeoutId, warningId, activityId, router]);

  // Extend session
  const extendSession = useCallback(async (): Promise<boolean> => {
    try {
      // Reset session timeout
      startSessionTimeout();
      setShowTimeoutWarning(false);
      setTimeLeft(0);

      logger.session("Session extended");
      return true;
    } catch (error) {
      logger.error("Session extension failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }, [startSessionTimeout]);

  // Check session validity
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      if (!session) {
        logger.session("Session check failed - no session");
        return false;
      }

      logger.debug("Session check passed");
      return true;
    } catch (error) {
      logger.error("Session check error", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }, [session]);

  // Initialize session management
  useEffect(() => {
    if (isAuthenticated) {
      startSessionTimeout();
      const cleanup = startActivityTracking();

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (warningId) clearTimeout(warningId);
        if (activityId) clearInterval(activityId);
        cleanup?.();
      };
    }
  }, [
    isAuthenticated,
    startSessionTimeout,
    startActivityTracking,
    timeoutId,
    warningId,
    activityId,
  ]);

  // Countdown timer for warning dialog
  useEffect(() => {
    if (!showTimeoutWarning || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setShowTimeoutWarning(false);
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showTimeoutWarning, timeLeft, handleLogout]);

  // Handle browser visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && isAuthenticated) {
        await checkSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [checkSession, isAuthenticated]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const contextValue: SessionContextType = {
    isAuthenticated,
    isLoading,
    logout: handleLogout,
    extendSession,
    checkSession,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}

      {/* Session Timeout Warning Dialog */}
      <Dialog open={showTimeoutWarning} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Session Expiring Soon</DialogTitle>
            <DialogDescription>
              Your session will expire in {formatTime(timeLeft)}. Would you like
              to extend your session?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleLogout}>
              Sign Out
            </Button>
            <Button onClick={extendSession}>Extend Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SessionContext.Provider>
  );
}

export function useUnifiedSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error(
      "useUnifiedSession must be used within a UnifiedSessionProvider"
    );
  }
  return context;
}
