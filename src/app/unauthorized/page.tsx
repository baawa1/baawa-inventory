'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { PageLoading } from '@/components/ui/loading';

export default function UnauthorizedPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (status === 'loading') return; // Still loading session

    if (!session?.user) {
      // No session, redirect to login
      router.push('/login');
      return;
    }

    if (session.user.status === 'APPROVED') {
      setIsRedirecting(true);
      router.push('/dashboard');
    }
  }, [session, status, router]);

  // Show loading while redirecting
  if (isRedirecting || status === 'loading') {
    return (
      <PageLoading
        title="Redirecting..."
        description="Taking you to the appropriate page based on your account status."
      />
    );
  }

  // Get user status for display
  const userStatus = session?.user?.status;

  const getStatusInfo = () => {
    switch (userStatus) {
      case 'REJECTED':
        return {
          icon: <XCircle className="h-16 w-16 text-red-500" />,
          title: 'Account Rejected',
          description: 'Your account has been rejected by an administrator.',
          message: 'Please contact support if you believe this is an error.',
          color: 'text-red-600',
        };
      case 'SUSPENDED':
        return {
          icon: <XCircle className="h-16 w-16 text-orange-500" />,
          title: 'Account Suspended',
          description: 'Your account has been temporarily suspended.',
          message: 'Please contact support to resolve this issue.',
          color: 'text-orange-600',
        };
      default:
        return {
          icon: <AlertTriangle className="h-16 w-16 text-yellow-500" />,
          title: 'Access Denied',
          description: 'This account is not active for system access.',
          message:
            'Only active, administrator-provisioned accounts can access the protected areas of this app. Contact your administrator if this account should be enabled.',
          color: 'text-yellow-600',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">{statusInfo.icon}</div>
          <CardTitle className={`text-2xl font-bold ${statusInfo.color}`}>
            {statusInfo.title}
          </CardTitle>
          <CardDescription data-testid="unauthorized-message">
            {statusInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-muted-foreground text-center text-sm">
            <p>{statusInfo.message}</p>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild variant="ghost" className="w-full">
              <Link href="/dashboard">Go Home</Link>
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
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
              }}
              isLoading={isRefreshing}
              loadingText="Refreshing..."
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
