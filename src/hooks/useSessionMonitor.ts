'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { INTERVALS } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { useSessionRefresh } from './api/useSessionRefresh';

export const useSessionMonitor = () => {
  const router = useRouter();
  const lastCheckRef = useRef<number>(0);
  const { data: session, update } = useSession();
  const sessionRefreshMutation = useSessionRefresh();

  const checkSessionUpdates = useCallback(async () => {
    // Prevent multiple simultaneous checks
    const now = Date.now();
    if (now - lastCheckRef.current < INTERVALS.SESSION_CHECK_MIN) {
      return; // Minimum 1 minute between checks
    }
    lastCheckRef.current = now;

    try {
      const data = await sessionRefreshMutation.mutateAsync();

      // If user data has changed, update session
      if (data.user && session?.user) {
        const hasChanges =
          data.user.role !== session.user.role ||
          data.user.status !== session.user.status ||
          data.user.isEmailVerified !== session.user.isEmailVerified;

        if (hasChanges) {
          logger.session('Session data changed, updating', {
            oldRole: session.user.role,
            newRole: data.user.role,
            oldStatus: session.user.status,
            newStatus: data.user.status,
          });
          
          await update();
          
          // Only refresh page for critical status changes
          if (data.user.status !== session.user.status) {
            router.refresh();
          }
        }
      }
    } catch (_error) {
      // Error is already logged by the mutation
      logger.debug('Session check failed, will retry on next interval');
    }
  }, [session, update, router, sessionRefreshMutation]);

  useEffect(() => {
    // Only monitor if user is logged in
    if (!session?.user?.id) return;

    // Check for session updates every 2 minutes
    const interval = setInterval(checkSessionUpdates, INTERVALS.SESSION_MONITOR);

    return () => clearInterval(interval);
  }, [session?.user?.id, checkSessionUpdates]);

  return {
    session,
    isChecking: sessionRefreshMutation.isPending,
    lastCheck: lastCheckRef.current,
  };
};
