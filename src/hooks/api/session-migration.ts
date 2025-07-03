/**
 * Session Migration Utilities
 * Helper functions and hooks for migrating from manual session management
 * to TanStack Query-based session management
 */

import { useSession } from "next-auth/react";
import { useEnhancedSession, useSessionQuery } from "@/hooks/api/session";
import { secureLogout } from "@/lib/session-management";

/**
 * Legacy session management hook compatibility wrapper
 * Drop-in replacement for the old useSessionManagement hook
 */
interface LegacySessionManagementOptions {
  enableActivityTracking?: boolean;
  enableTimeoutWarning?: boolean;
  onSessionWarning?: () => void;
  onSessionTimeout?: () => void;
  activityCheckInterval?: number;
}

export function useSessionManagement(
  options: LegacySessionManagementOptions = {}
) {
  const { data: session, status } = useSession();
  const enhancedSession = useEnhancedSession({
    enableActivityTracking: options.enableActivityTracking ?? true,
    enableTimeoutWarning: options.enableTimeoutWarning ?? true,
    enablePeriodicValidation: true,
    onSessionWarning: options.onSessionWarning,
    onSessionTimeout: options.onSessionTimeout,
    activityCheckInterval: options.activityCheckInterval ?? 30000,
  });

  // Return the same interface as the legacy hook
  return {
    session,
    status,
    isAuthenticated: status === "authenticated",
    checkSession: enhancedSession.checkSession,
    recoverSession: enhancedSession.recoverSession,
    logout: enhancedSession.logout,
    // Additional new features
    sessionValidation: enhancedSession.sessionValidation,
    isValidatingSession: enhancedSession.isValidatingSession,
    extendSession: enhancedSession.extendSession,
  };
}

/**
 * Simple session state hook for components that only need basic session info
 */
export function useSessionState() {
  const sessionQuery = useSessionQuery();

  return {
    session: sessionQuery.session,
    status: sessionQuery.status,
    isAuthenticated: sessionQuery.isAuthenticated,
    isLoading: sessionQuery.isLoading,
    isValid: sessionQuery.isValid,
    timeRemaining: sessionQuery.timeRemaining,
    error: sessionQuery.error,
  };
}

/**
 * Session validation hook for components that need to check session validity
 */
export function useSessionValidationState() {
  const enhancedSession = useEnhancedSession({
    enableActivityTracking: false,
    enableTimeoutWarning: false,
    enablePeriodicValidation: false,
  });

  return {
    isValid: enhancedSession.sessionValidation?.isValid ?? false,
    timeRemaining: enhancedSession.sessionValidation?.timeRemaining,
    expiresAt: enhancedSession.sessionValidation?.expiresAt,
    isValidating: enhancedSession.isValidatingSession,
    error: enhancedSession.sessionValidationError,
    checkSession: enhancedSession.checkSession,
  };
}

/**
 * Session actions hook for components that need to perform session operations
 */
export function useSessionActions() {
  const enhancedSession = useEnhancedSession({
    enableActivityTracking: false,
    enableTimeoutWarning: false,
    enablePeriodicValidation: false,
  });

  return {
    logout: enhancedSession.logout,
    extendSession: enhancedSession.extendSession,
    recoverSession: enhancedSession.recoverSession,
    checkSession: enhancedSession.checkSession,
    isRefreshing: enhancedSession.isRefreshingSession,
    refreshError: enhancedSession.refreshSessionError,
  };
}

/**
 * Migration guide and utilities
 */
export const MIGRATION_GUIDE = {
  // Old pattern
  OLD_USAGE: `
    // Old way with manual state management
    const { session, status, isAuthenticated, checkSession, logout } = useSessionManagement({
      enableActivityTracking: true,
      enableTimeoutWarning: true,
      onSessionWarning: () => setShowWarning(true),
      onSessionTimeout: () => handleTimeout(),
    });
  `,

  // New pattern
  NEW_USAGE: `
    // New way with TanStack Query
    const { 
      session, 
      status, 
      isAuthenticated, 
      checkSession, 
      logout,
      sessionValidation,
      isValidatingSession,
      extendSession 
    } = useSessionManagement({
      enableActivityTracking: true,
      enableTimeoutWarning: true,
      onSessionWarning: () => setShowWarning(true),
      onSessionTimeout: () => handleTimeout(),
    });
    
    // Or use specific hooks for targeted functionality
    const sessionState = useSessionState();
    const sessionActions = useSessionActions();
    const sessionValidation = useSessionValidationState();
  `,

  // Migration steps
  MIGRATION_STEPS: [
    "1. Replace useSessionManagement import with the new version",
    "2. Update SessionProvider to use SessionProviderQuery if needed",
    "3. Test session timeout and recovery functionality",
    "4. Update components to use new session validation states",
    "5. Remove manual session state management code",
    "6. Update error handling to use TanStack Query error states",
  ],

  // Benefits
  BENEFITS: [
    "Automatic query invalidation and cache management",
    "Built-in loading states and error handling",
    "Background session validation and refresh",
    "Optimistic updates and retry logic",
    "DevTools integration for debugging",
    "Better TypeScript support",
    "Reduced boilerplate code",
    "Consistent error handling patterns",
  ],
} as const;

/**
 * Development helper to identify components using old session patterns
 */
export function logSessionMigrationStatus() {
  if (process.env.NODE_ENV === "development") {
    console.group("🔄 Session Migration Status");
    console.log("✅ TanStack Query session hooks available");
    console.log("✅ Legacy compatibility wrapper active");
    console.log("📚 Migration guide available:", MIGRATION_GUIDE);
    console.groupEnd();
  }
}
