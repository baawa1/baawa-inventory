'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useLogout } from '@/hooks/useLogout';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

/**
 * Immediate logout component - automatically logs out when mounted
 * This should be used sparingly and only in specific scenarios like:
 * - Security-triggered logouts
 * - Session expiration
 * - Administrative actions
 */
export default function ImmediateLogoutPage() {
  const { logout, isLoading: isLoggingOut } = useLogout();
  const [error, setError] = useState<string | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Immediate logout failed:', err);
      setError('Logout failed. Forcing logout...');

      // Force logout even if there's an error
      forceLogout();
    }
  }, [logout]);

  useEffect(() => {
    // Only trigger logout once and if not already logging out
    if (!isLoggingOut && !hasAttempted) {
      setHasAttempted(true);
      handleLogout();
    }
  }, [isLoggingOut, hasAttempted, handleLogout]);

  const forceLogout = () => {
    // Clear everything and redirect
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();

      // Clear NextAuth cookies manually
      const cookies = [
        'next-auth.session-token',
        'next-auth.csrf-token',
        'next-auth.callback-url',
        '__Secure-next-auth.session-token',
        '__Secure-next-auth.csrf-token',
      ];

      cookies.forEach(cookieName => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      });

      setTimeout(() => {
        router.push('/login');
      }, 1000);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {error ? 'Logout Error' : 'Logging out...'}
          </CardTitle>
          <p className="text-muted-foreground mt-2 text-sm">
            {error
              ? "There was an issue logging out. We'll force logout to ensure security."
              : 'Please wait while we securely log you out.'}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {error ? (
            <>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div className="rounded bg-red-50 p-2 text-center text-sm text-red-600">
                {error}
              </div>
              <Button onClick={forceLogout} variant="destructive" size="sm">
                Force Logout Now
              </Button>
            </>
          ) : (
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
