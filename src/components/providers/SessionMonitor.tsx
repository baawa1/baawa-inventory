'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { INTERVALS } from '@/lib/constants';
import { logger } from '@/lib/logger';

// Dynamic import to avoid webpack issues
let useSession: any = null;

// Lazy load next-auth to prevent webpack issues
const loadNextAuth = async () => {
  if (typeof window !== 'undefined' && !useSession) {
    try {
      const nextAuth = await import('next-auth/react');
      useSession = nextAuth.useSession;
    } catch (error) {
      logger.error('Failed to load next-auth', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
};

export function SessionMonitor() {
  const router = useRouter();
  const lastCheckRef = useRef<number>(0);
  const sessionData = useSession?.() || { data: null, update: () => {} };

  // Initialize next-auth on mount
  useEffect(() => {
    loadNextAuth();
  }, []);

  useEffect(() => {
    // Only monitor if user is logged in and useSession is available
    if (!useSession || !sessionData?.data?.user?.id) return;

    // Check for session updates every 2 minutes instead of 30 seconds
    const interval = setInterval(async () => {
      try {
        // Prevent multiple simultaneous checks
        const now = Date.now();
        if (now - lastCheckRef.current < INTERVALS.SESSION_CHECK_MIN) return; // Minimum 1 minute between checks
        lastCheckRef.current = now;

        const response = await fetch('/api/auth/refresh-session', {
          method: 'POST',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();

          // If user data has changed, update session
          if (data.user && sessionData?.data?.user) {
            const hasChanges =
              data.user.role !== sessionData.data.user.role ||
              data.user.status !== sessionData.data.user.status ||
              data.user.isEmailVerified !==
                sessionData.data.user.isEmailVerified;

            if (hasChanges) {
              logger.session('Session data changed, updating', {
                oldRole: sessionData.data.user.role,
                newRole: data.user.role,
                oldStatus: sessionData.data.user.status,
                newStatus: data.user.status,
              });
              await sessionData.update();
              // Only refresh page for critical status changes
              if (data.user.status !== sessionData.data.user.status) {
                router.refresh();
              }
            }
          }
        }
      } catch (error) {
        logger.error('Error checking session updates', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }, INTERVALS.SESSION_MONITOR); // Check every 2 minutes instead of 30 seconds

    return () => clearInterval(interval);
  }, [sessionData, router]);

  return null; // This component doesn't render anything
}
