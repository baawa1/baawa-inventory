'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { useSessionMonitor } from '@/hooks/useSessionMonitor';

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
  // Initialize next-auth on mount
  useEffect(() => {
    loadNextAuth();
  }, []);

  // Use the custom hook for session monitoring
  useSessionMonitor();

  return null; // This component doesn't render anything
}
