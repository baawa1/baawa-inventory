'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UseAdminGuardResult {
  isAdmin: boolean;
  isLoading: boolean;
  session: any;
}

/**
 * Custom hook for admin route protection
 * Automatically redirects non-admin users to unauthorized page
 * Provides loading states and admin status
 */
export function useAdminGuard(): UseAdminGuardResult {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading = status === 'loading';
  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // Redirect if not authenticated or not admin
    if (!session || !isAdmin) {
      router.push('/unauthorized');
      return;
    }
  }, [session, isAdmin, isLoading, router]);

  return {
    isAdmin,
    isLoading,
    session,
  };
}
