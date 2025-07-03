/**
 * Session Management Hooks using TanStack Query
 * Provides session validation, refresh, and activity tracking
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSession } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { useCallback, useRef, useEffect } from 'react';
import { 
  checkSessionValidity, 
  refreshSession, 
  secureLogout,
  SessionInfo,
  SessionTimeoutManager,
  updateUserActivity 
} from '@/lib/session-management';
import { queryKeys } from '@/lib/query-client';

/**
 * Query hook for session validity check
 */
export function useSessionValidation() {
  const { data: session, status } = useSession();
  
  return useQuery({
    queryKey: queryKeys.session.validity(),
    queryFn: checkSessionValidity,
    enabled: status === 'authenticated' && !!session,
    // Check every 30 seconds for active sessions
    refetchInterval: 30000,
    // Retry once on failure
    retry: 1,
    retryDelay: 1000,
    // Keep data fresh for 1 minute
    staleTime: 60 * 1000,
    // Don't refetch on window focus for session validation
    refetchOnWindowFocus: false,
  });
}

/**
 * Mutation hook for session refresh
 */
export function useSessionRefresh() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: refreshSession,
    onSuccess: () => {
      // Invalidate session-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.session.all });
      // Also invalidate user queries as session refresh may update user data
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error('Session refresh failed:', error);
      // On refresh failure, clear all queries and logout
      queryClient.clear();
    },
  });
}

/**
 * Mutation hook for user activity tracking
 */
export function useActivityTracking() {
  const { data: session } = useSession();
  
  return useMutation({
    mutationFn: async () => {
      if (session?.user?.id) {
        await updateUserActivity(session.user.id);
      }
    },
    // Don't show loading states for activity tracking
    meta: {
      silent: true,
    },
  });
}

/**
 * Enhanced session management hook with TanStack Query integration
 */
interface UseEnhancedSessionOptions {
  enableActivityTracking?: boolean;
  enableTimeoutWarning?: boolean;
  enablePeriodicValidation?: boolean;
  onSessionWarning?: () => void;
  onSessionTimeout?: () => void;
  activityCheckInterval?: number;
}

export function useEnhancedSession({
  enableActivityTracking = true,
  enableTimeoutWarning = true,
  enablePeriodicValidation = true,
  onSessionWarning,
  onSessionTimeout,
  activityCheckInterval = 30000,
}: UseEnhancedSessionOptions = {}) {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  
  // TanStack Query hooks
  const sessionValidation = useSessionValidation();
  const sessionRefresh = useSessionRefresh();
  const activityTracking = useActivityTracking();
  
  // Timeout manager ref
  const timeoutManagerRef = useRef<SessionTimeoutManager | null>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Session validity check with TanStack Query
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      if (status === 'authenticated' && session) {
        // Use TanStack Query's refetch for fresh data
        const result = await sessionValidation.refetch();
        const sessionInfo = result.data;
        
        if (!sessionInfo?.isValid) {
          await secureLogout();
          queryClient.clear();
          return false;
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Session check failed:', error);
      return false;
    }
  }, [session, status, sessionValidation, queryClient]);

  // Session recovery with TanStack Query
  const recoverSession = useCallback(async (): Promise<boolean> => {
    try {
      const success = await sessionRefresh.mutateAsync();
      if (success) {
        // Reset timeout manager if active
        timeoutManagerRef.current?.resetTimeout();
        return true;
      } else {
        await secureLogout();
        queryClient.clear();
        return false;
      }
    } catch (error) {
      console.error('Session recovery failed:', error);
      return false;
    }
  }, [sessionRefresh, queryClient]);

  // Initialize session timeout manager
  useEffect(() => {
    if (status === 'authenticated' && enableTimeoutWarning) {
      try {
        timeoutManagerRef.current = new SessionTimeoutManager(
          onSessionWarning,
          () => {
            onSessionTimeout?.();
            queryClient.clear();
          }
        );

        timeoutManagerRef.current.startMonitoring();

        return () => {
          try {
            timeoutManagerRef.current?.destroy();
          } catch (error) {
            console.error('Error destroying session timeout manager:', error);
          }
        };
      } catch (error) {
        console.error('Error initializing session timeout manager:', error);
      }
    }
  }, [status, enableTimeoutWarning, onSessionWarning, onSessionTimeout, queryClient]);

  // Activity tracking with TanStack Query
  useEffect(() => {
    if (!enableActivityTracking || status !== 'authenticated') return;

    const activityEvents = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
    ];

    const handleActivity = () => {
      const now = Date.now();
      
      // Only process activity if it's been more than 1 minute since last activity
      if (now - lastActivityRef.current > 60000) {
        lastActivityRef.current = now;
        
        // Reset timeout manager
        timeoutManagerRef.current?.resetTimeout();
        
        // Track activity (silent mutation)
        activityTracking.mutate();
      }
    };

    // Add event listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Periodic session validation if enabled
    const startPeriodicValidation = () => {
      if (!enablePeriodicValidation) return;
      
      if (activityTimeoutRef.current) {
        clearInterval(activityTimeoutRef.current);
      }

      activityTimeoutRef.current = setInterval(async () => {
        try {
          const isValid = await checkSession();
          if (!isValid && status === 'authenticated') {
            console.warn('Session validation failed, attempting recovery');
            const recovered = await recoverSession();
            if (!recovered) {
              console.error('Session recovery failed');
            }
          }
        } catch (error) {
          console.error('Periodic session check failed:', error);
        }
      }, activityCheckInterval);
    };

    startPeriodicValidation();

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });

      if (activityTimeoutRef.current) {
        clearInterval(activityTimeoutRef.current);
      }
    };
  }, [
    enableActivityTracking,
    enablePeriodicValidation,
    status,
    activityCheckInterval,
    checkSession,
    recoverSession,
    activityTracking,
  ]);

  // Handle browser visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      try {
        if (document.visibilityState === 'visible' && status === 'authenticated') {
          await checkSession();
        }
      } catch (error) {
        console.error('Error during visibility change session check:', error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkSession, status]);

  // Enhanced logout with query cleanup
  const logout = useCallback(async () => {
    queryClient.clear();
    await secureLogout();
  }, [queryClient]);

  // Extend session with TanStack Query
  const extendSession = useCallback(async () => {
    try {
      const success = await sessionRefresh.mutateAsync();
      if (success) {
        timeoutManagerRef.current?.resetTimeout();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to extend session:', error);
      return false;
    }
  }, [sessionRefresh]);

  return {
    // Session state
    session,
    status,
    isAuthenticated: status === 'authenticated',
    
    // Session validation state
    sessionValidation: sessionValidation.data,
    isValidatingSession: sessionValidation.isLoading,
    sessionValidationError: sessionValidation.error,
    
    // Session actions
    checkSession,
    recoverSession,
    logout,
    extendSession,
    
    // Activity tracking state
    isTrackingActivity: activityTracking.isPending,
    
    // Session refresh state
    isRefreshingSession: sessionRefresh.isPending,
    refreshSessionError: sessionRefresh.error,
  };
}

/**
 * Simple session context hook (backward compatibility)
 */
export function useSessionQuery() {
  const { data: session, status } = useSession();
  const sessionValidation = useSessionValidation();
  
  return {
    session,
    status,
    isAuthenticated: status === 'authenticated',
    isValid: sessionValidation.data?.isValid ?? false,
    timeRemaining: sessionValidation.data?.timeRemaining,
    isLoading: status === 'loading' || sessionValidation.isLoading,
    error: sessionValidation.error,
  };
}
