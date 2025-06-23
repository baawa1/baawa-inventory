/**
 * Session Management Utilities
 * Provides utilities for managing user sessions, activity tracking, and secure cleanup
 */

import { getSession, signOut } from "next-auth/react";
import { createServerSupabaseClient } from "@/lib/supabase";

export interface SessionInfo {
  isValid: boolean;
  expiresAt?: Date;
  lastActivity?: Date;
  timeRemaining?: number;
}

/**
 * Check if the current session is valid and not expired
 */
export async function checkSessionValidity(): Promise<SessionInfo> {
  try {
    const session = await getSession();

    if (!session) {
      return { isValid: false };
    }

    const now = new Date();
    const expiresAt = new Date(session.expires);
    const timeRemaining = expiresAt.getTime() - now.getTime();

    return {
      isValid: timeRemaining > 0,
      expiresAt,
      timeRemaining: Math.max(0, timeRemaining),
    };
  } catch (error) {
    console.error("Error checking session validity:", error);
    return { isValid: false };
  }
}

/**
 * Force session refresh by updating the session
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const session = await getSession();
    if (session) {
      // Trigger session update
      window.dispatchEvent(new Event("visibilitychange"));
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error refreshing session:", error);
    return false;
  }
}

/**
 * Secure logout with comprehensive cleanup
 */
export async function secureLogout(): Promise<void> {
  try {
    // Clear client-side storage
    if (typeof window !== "undefined") {
      // Clear localStorage
      const keysToRemove = [
        "inventory-cart",
        "pos-session",
        "user-preferences",
        "draft-data",
      ];

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear any cookies that aren't handled by NextAuth
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
        if (
          name.trim().startsWith("inventory-") ||
          name.trim().startsWith("pos-")
        ) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      });
    }

    // Sign out through NextAuth
    await signOut({
      callbackUrl: "/login",
      redirect: true,
    });
  } catch (error) {
    console.error("Error during secure logout:", error);
    // Fallback: force redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
}

/**
 * Update user activity timestamp (server-side)
 */
export async function updateUserActivity(userId: string): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();

    await supabase
      .from("users")
      .update({
        last_activity: new Date().toISOString(),
      })
      .eq("id", parseInt(userId));
  } catch (error) {
    console.error("Error updating user activity:", error);
  }
}

/**
 * Session timeout warning utility
 */
export class SessionTimeoutManager {
  private timeoutId: NodeJS.Timeout | null = null;
  private warningTimeoutId: NodeJS.Timeout | null = null;
  private onWarning?: () => void;
  private onTimeout?: () => void;

  constructor(onWarning?: () => void, onTimeout?: () => void) {
    this.onWarning = onWarning;
    this.onTimeout = onTimeout;
  }

  /**
   * Start monitoring session timeout
   */
  async startMonitoring(): Promise<void> {
    const sessionInfo = await checkSessionValidity();

    if (!sessionInfo.isValid || !sessionInfo.timeRemaining) {
      this.handleTimeout();
      return;
    }

    // Clear existing timeouts
    this.clearTimeouts();

    // Set warning timeout (5 minutes before expiry)
    const warningTime = Math.max(0, sessionInfo.timeRemaining - 5 * 60 * 1000);
    if (warningTime > 0) {
      this.warningTimeoutId = setTimeout(() => {
        this.onWarning?.();
      }, warningTime);
    }

    // Set session timeout
    this.timeoutId = setTimeout(() => {
      this.handleTimeout();
    }, sessionInfo.timeRemaining);
  }

  /**
   * Reset the timeout (call when user activity is detected)
   */
  async resetTimeout(): Promise<void> {
    await this.startMonitoring();
  }

  /**
   * Clear all timeouts
   */
  clearTimeouts(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
      this.warningTimeoutId = null;
    }
  }

  /**
   * Handle session timeout
   */
  private handleTimeout(): void {
    this.onTimeout?.();
    secureLogout();
  }

  /**
   * Cleanup when component unmounts
   */
  destroy(): void {
    this.clearTimeouts();
  }
}

/**
 * Hook for session activity tracking (client-side)
 */
export function useSessionActivity() {
  if (typeof window === "undefined") return;

  const activityEvents = [
    "mousedown",
    "mousemove",
    "keypress",
    "scroll",
    "touchstart",
  ];
  let lastActivity = Date.now();
  let activityTimeout: NodeJS.Timeout;

  const updateActivity = async () => {
    const now = Date.now();
    // Only update if it's been more than 5 minutes since last update
    if (now - lastActivity > 5 * 60 * 1000) {
      lastActivity = now;

      try {
        const session = await getSession();
        if (session?.user?.id) {
          // Could make an API call to update activity
          // For now, just refresh the session
          await refreshSession();
        }
      } catch (error) {
        console.error("Error updating session activity:", error);
      }
    }
  };

  const handleActivity = () => {
    clearTimeout(activityTimeout);
    activityTimeout = setTimeout(updateActivity, 1000); // Debounce
  };

  // Add activity listeners
  activityEvents.forEach((event) => {
    document.addEventListener(event, handleActivity, { passive: true });
  });

  // Cleanup function
  return () => {
    activityEvents.forEach((event) => {
      document.removeEventListener(event, handleActivity);
    });
    clearTimeout(activityTimeout);
  };
}
