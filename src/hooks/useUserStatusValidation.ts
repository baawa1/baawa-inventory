'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { logger } from '@/lib/logger';

interface UseUserStatusValidationOptions {
  redirectOnApproved?: boolean;
  autoRefresh?: boolean;
  pollInterval?: number;
}

interface UserStatusValidationResult {
  userStatus: string | null;
  isRefreshing: boolean;
  hasTriedRefresh: boolean;
  refreshUserStatus: () => Promise<void>;
}

/**
 * Hook for managing user status validation using Auth.js v5
 * Uses only official Auth.js v5 patterns - no API calls in useEffect
 */
export function useUserStatusValidation(
  options: UseUserStatusValidationOptions = {}
): UserStatusValidationResult {
  const {
    redirectOnApproved = true,
    autoRefresh = true,
    pollInterval,
  } = options;

  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasTriedRefresh, setHasTriedRefresh] = useState(false);

  // Function to refresh user status using Auth.js v5 update
  const refreshUserStatus = useCallback(async () => {
    if (!session?.user?.id) return;

    setIsRefreshing(true);
    setHasTriedRefresh(true);

    try {
      // Use Auth.js v5 update() to trigger a fresh session fetch
      await update();
    } catch (error) {
      logger.error('Error refreshing session', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [session, update]);

  // Update user status when session changes (no API calls)
  useEffect(() => {
    if (session?.user?.status) {
      setUserStatus(session.user.status);
    } else if (session === null) {
      // Session is explicitly null (unauthenticated)
      setUserStatus(null);
    }
    // Session is undefined (still loading) or has no status - do nothing
  }, [session]);

  // Handle status-based routing (no API calls)
  useEffect(() => {
    if (!userStatus || status === 'loading') return;

    // Redirect approved users to dashboard
    if (redirectOnApproved && userStatus === 'APPROVED') {
      router.push('/dashboard');
      return;
    }

    // Keep pending users on current page
    if (userStatus === 'PENDING') {
      // Stay on current page
      return;
    }

    // Redirect rejected/suspended users to appropriate pages
    if (userStatus === 'REJECTED') {
      router.push('/unauthorized');
      return;
    }

    if (userStatus === 'SUSPENDED') {
      router.push('/unauthorized');
      return;
    }
  }, [userStatus, redirectOnApproved, router, status]);

  // Auto-refresh logic using Auth.js v5 update (no API calls)
  useEffect(() => {
    if (!autoRefresh || !session?.user?.id || !pollInterval) return;

    const interval = setInterval(() => {
      refreshUserStatus();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, session, pollInterval, refreshUserStatus]);

  return {
    userStatus,
    isRefreshing,
    hasTriedRefresh,
    refreshUserStatus,
  };
}
