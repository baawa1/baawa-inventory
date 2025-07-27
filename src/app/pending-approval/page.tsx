'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, RefreshCw } from 'lucide-react';

export default function PendingApprovalPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // Only VERIFIED users should stay on this page
    // PENDING users should be on check-email page
    // APPROVED users should go to dashboard
    // REJECTED/SUSPENDED users should go to unauthorized
    if (session?.user?.status === 'PENDING') {
      router.push('/check-email');
      return;
    }

    if (session?.user?.status === 'APPROVED') {
      router.push('/dashboard');
      return;
    }

    if (
      session?.user?.status === 'REJECTED' ||
      session?.user?.status === 'SUSPENDED'
    ) {
      router.push('/unauthorized');
      return;
    }

    // If status is not VERIFIED, redirect to unauthorized
    if (session?.user?.status !== 'VERIFIED') {
      router.push('/unauthorized');
      return;
    }
  }, [session, status, router]);

  const handleLogout = () => {
    router.push('/logout');
  };

  const handleRefreshSession = async () => {
    // Debug logging removed for production
    // Debug logging removed for production

    setIsRefreshing(true);
    try {
      // Simply call NextAuth's update() - it will now fetch fresh data from DB
      await update();
      // Debug logging removed for production
    } catch (error) {
      console.error('Error refreshing session:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect
  }

  const getStatusIcon = () => {
    // This page should only be accessible to VERIFIED users
    return <Clock className="h-16 w-16 text-yellow-500" />;
  };

  const getStatusMessage = () => {
    // This page should only be accessible to VERIFIED users
    // Other statuses should be redirected elsewhere
    return {
      title: 'Your account is pending approval',
      description: 'Please wait for an administrator to approve your account.',
    };
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">{getStatusIcon()}</div>
            <CardTitle className="text-2xl font-bold">
              {statusInfo.title}
            </CardTitle>
            <CardDescription className="">
              {statusInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm">
                Logged in as:{' '}
                <span className="font-medium">{session?.user?.email}</span>
              </p>
              <p className="text-sm">
                Role: <span className="font-medium">{session?.user?.role}</span>
              </p>
              <p className="text-sm">
                Status:{' '}
                <span className="font-medium">{session?.user?.status}</span>
              </p>
            </div>

            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
              <p className="text-sm text-yellow-800">
                Your account registration was successful! Please wait for an
                administrator to approve your access.
              </p>
            </div>

            <Button
              onClick={handleLogout}
              variant="secondary"
              className="w-full"
            >
              Sign Out
            </Button>

            <Button
              onClick={handleRefreshSession}
              disabled={isRefreshing}
              variant="outline"
              className="w-full"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
