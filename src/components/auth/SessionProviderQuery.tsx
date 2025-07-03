/**
 * Enhanced SessionProvider with TanStack Query integration
 * Provides session management with timeout warnings and activity tracking
 */

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useEnhancedSession } from "@/hooks/api/session";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SessionContextType {
  isAuthenticated: boolean;
  isValidatingSession: boolean;
  sessionValidation: any;
  logout: () => Promise<void>;
  extendSession: () => Promise<boolean>;
  checkSession: () => Promise<boolean>;
  recoverSession: () => Promise<boolean>;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return context;
}

interface SessionProviderProps {
  children: React.ReactNode;
  enableActivityTracking?: boolean;
  enableTimeoutWarning?: boolean;
  enablePeriodicValidation?: boolean;
  activityCheckInterval?: number;
}

export function SessionProvider({ 
  children,
  enableActivityTracking = true,
  enableTimeoutWarning = true,
  enablePeriodicValidation = true,
  activityCheckInterval = 30000,
}: SessionProviderProps) {
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const {
    isAuthenticated,
    sessionValidation,
    isValidatingSession,
    logout,
    extendSession,
    checkSession,
    recoverSession,
  } = useEnhancedSession({
    enableActivityTracking,
    enableTimeoutWarning,
    enablePeriodicValidation,
    activityCheckInterval,
    onSessionWarning: () => {
      setShowTimeoutWarning(true);
      setTimeLeft(300); // 5 minutes in seconds
    },
    onSessionTimeout: () => {
      setShowTimeoutWarning(false);
      logout();
    },
  });

  // Countdown timer for warning dialog
  useEffect(() => {
    if (!showTimeoutWarning || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setShowTimeoutWarning(false);
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showTimeoutWarning, timeLeft, logout]);

  const handleExtendSession = async (): Promise<boolean> => {
    try {
      const success = await extendSession();
      if (success) {
        setShowTimeoutWarning(false);
        setTimeLeft(0);
        return true;
      } else {
        console.error("Failed to extend session");
        await logout();
        return false;
      }
    } catch (error) {
      console.error("Failed to extend session:", error);
      await logout();
      return false;
    }
  };

  const handleLogout = async () => {
    setShowTimeoutWarning(false);
    await logout();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const contextValue: SessionContextType = {
    isAuthenticated,
    isValidatingSession,
    sessionValidation,
    logout: handleLogout,
    extendSession: handleExtendSession,
    checkSession,
    recoverSession,
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
            <Button onClick={handleExtendSession}>Extend Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SessionContext.Provider>
  );
}
