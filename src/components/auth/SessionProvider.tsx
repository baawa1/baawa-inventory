"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSessionManagement } from "@/hooks/useSessionManagement";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { refreshSession } from "@/lib/session-management";

interface SessionContextType {
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  extendSession: () => Promise<void>;
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
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const { isAuthenticated, logout, checkSession } = useSessionManagement({
    enableActivityTracking: true,
    enableTimeoutWarning: true,
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

  const extendSession = async () => {
    try {
      await refreshSession();
      setShowTimeoutWarning(false);
      setTimeLeft(0);
    } catch (error) {
      console.error("Failed to extend session:", error);
      await logout();
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
    logout: handleLogout,
    extendSession,
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
