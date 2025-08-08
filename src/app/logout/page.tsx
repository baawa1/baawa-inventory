'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, ArrowLeft } from 'lucide-react';
import { useLogout } from '@/hooks/useLogout';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const { logout, isLoading: isLoggingOut } = useLogout();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setError(null);
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
      setError('Logout failed. Redirecting anyway...');

      // Force logout even if there's an error
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  };

  const handleForceLogout = () => {
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

      router.push('/login');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Confirm Logout</CardTitle>
          <p className="text-muted-foreground mt-2 text-sm">
            Are you sure you want to log out of your account?
          </p>
          {error && (
            <div className="mt-2 rounded bg-red-50 p-2 text-sm text-red-600">
              {error}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full"
            variant="destructive"
          >
            {isLoggingOut ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Confirm Logout
              </>
            )}
          </Button>

          {error && (
            <Button
              onClick={handleForceLogout}
              className="w-full"
              variant="outline"
            >
              Force Logout
            </Button>
          )}

          <Button
            asChild
            variant="outline"
            className="w-full"
            disabled={isLoggingOut}
          >
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
