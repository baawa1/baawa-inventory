'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSessionUpdate } from '@/hooks/useSessionUpdate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Mail } from 'lucide-react';
import {
  useEmailVerification,
  useResendVerificationEmail,
} from '@/hooks/api/useEmailVerification';
import { PageLoading, Spinner } from '@/components/ui/loading';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, updateSession } = useSessionUpdate();

  // Add hydration state to prevent SSR/client mismatch
  const [isHydrated, setIsHydrated] = useState(false);

  const [verificationStatus, setVerificationStatus] = useState<
    'idle' | 'verifying' | 'success' | 'error' | 'expired' | 'already-verified'
  >('idle');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const token = searchParams.get('token');
  const emailFromSearch = searchParams.get('email') || '';
  const emailVerificationMutation = useEmailVerification();
  const resendVerificationMutation = useResendVerificationEmail();
  const attemptedTokenRef = useRef<string | null>(null);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Determine overall status from session and verification state
  const getOverallStatus = () => {
    // During SSR or before hydration, show loading state
    if (!isHydrated) {
      return 'loading';
    }

    // If we're in the middle of verification, show that status
    if (verificationStatus !== 'idle') {
      return verificationStatus;
    }

    // If user is logged in and email is already verified
    if (session?.user?.isEmailVerified) {
      return 'already-verified';
    }

    // If there's a token but we haven't verified yet
    if (token) {
      return 'has-token';
    }

    // No token and not verified - show form
    return 'no-token';
  };

  const overallStatus = getOverallStatus();

  // Set email from session when available
  useEffect(() => {
    if (!email && emailFromSearch) {
      setEmail(emailFromSearch);
      return;
    }

    if (!email && session?.user?.email) {
      setEmail(session.user.email);
    }
  }, [email, emailFromSearch, session?.user?.email]);

  const getPostVerificationPath = useCallback(
    (verifiedEmail?: string) => {
      if (session?.user?.status === 'APPROVED') {
        return '/dashboard';
      }

      if (session?.user) {
        return '/pending-approval';
      }

      const loginParams = new URLSearchParams();
      if (verifiedEmail) {
        loginParams.set('email', verifiedEmail);
      }
      loginParams.set('verified', '1');

      return `/login?${loginParams.toString()}`;
    },
    [session]
  );

  const handleVerifyToken = useCallback(async () => {
    if (!token) return;

    setVerificationStatus('verifying');
    setVerificationMessage('Verifying your email...');

    try {
      const data = await emailVerificationMutation.mutateAsync({ token });
      const nextPath = getPostVerificationPath(data.email);

      setVerificationStatus('success');
      setVerificationMessage(data.message);
      setEmail(data.email);

      // Refresh session if user is logged in
      if (session && data.shouldRefreshSession) {
        try {
          await updateSession();
        } catch (sessionError) {
          console.error(
            'Error updating session after email verification:',
            sessionError
          );
        }
      }

      // Auto-redirect after successful verification
      setTimeout(() => {
        if (!isRedirecting) {
          setIsRedirecting(true);
          router.push(nextPath);
        }
      }, 2000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred';
      if (errorMessage.toLowerCase().includes('already verified')) {
        setVerificationStatus('already-verified');
      } else if (errorMessage.toLowerCase().includes('expired')) {
        setVerificationStatus('expired');
      } else {
        setVerificationStatus('error');
      }
      setVerificationMessage(errorMessage);
    }
  }, [
    getPostVerificationPath,
    token,
    router,
    session,
    updateSession,
    isRedirecting,
    emailVerificationMutation,
  ]);

  useEffect(() => {
    if (
      !isHydrated ||
      !token ||
      attemptedTokenRef.current === token ||
      verificationStatus !== 'idle'
    ) {
      return;
    }

    attemptedTokenRef.current = token;
    void handleVerifyToken();
  }, [handleVerifyToken, isHydrated, token, verificationStatus]);

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setResendLoading(true);
    setResendMessage('');

    try {
      const data = await resendVerificationMutation.mutateAsync({ email });
      if (data.verificationEmailSent) {
        setResendMessage('Verification email sent! Please check your inbox.');
      }
    } catch (error) {
      setResendMessage(
        error instanceof Error
          ? error.message
          : 'Failed to send verification email. Please try again.'
      );
    } finally {
      setResendLoading(false);
    }
  };

  const postVerificationPath = getPostVerificationPath(email);
  const postVerificationButtonLabel = session?.user
    ? session.user.status === 'APPROVED'
      ? 'Continue to Dashboard'
      : 'Continue to Pending Approval'
    : 'Continue to Login';

  const getStatusIcon = () => {
    switch (overallStatus) {
      case 'loading':
      case 'verifying':
        return <Spinner size="lg" className="text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
      case 'expired':
        return <XCircle className="h-16 w-16 text-red-500" />;
      case 'already-verified':
        return <AlertCircle className="h-16 w-16 text-yellow-500" />;
      case 'has-token':
        return <Mail className="h-16 w-16 text-blue-500" />;
      case 'no-token':
        return <Mail className="h-16 w-16 text-gray-500" />;
      default:
        return <Mail className="h-16 w-16 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (overallStatus) {
      case 'loading':
      case 'verifying':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
      case 'expired':
        return 'text-red-600';
      case 'already-verified':
        return 'text-yellow-600';
      case 'has-token':
        return 'text-blue-600';
      case 'no-token':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusTitle = () => {
    switch (overallStatus) {
      case 'loading':
        return 'Loading...';
      case 'verifying':
        return 'Verifying Email...';
      case 'success':
        return 'Email Verified!';
      case 'error':
        return 'Verification Failed';
      case 'expired':
        return 'Token Expired';
      case 'already-verified':
        return 'Already Verified';
      case 'has-token':
        return 'Verify Your Email';
      case 'no-token':
        return 'Request Verification';
      default:
        return 'Email Verification';
    }
  };

  const getStatusMessage = () => {
    if (overallStatus === 'loading') {
      return 'Please wait while we load your verification status...';
    }

    if (verificationMessage) {
      return verificationMessage;
    }

    switch (overallStatus) {
      case 'already-verified':
        return 'Your email is already verified. You can continue to your account.';
      case 'has-token':
        return 'We are verifying your email automatically.';
      case 'no-token':
        return 'Please enter your email address to receive a verification link.';
      default:
        return '';
    }
  };

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mb-4 flex justify-center">
                <Spinner size="lg" className="text-blue-500" />
              </div>
              <CardTitle className="text-2xl text-blue-600">
                Loading...
              </CardTitle>
              <CardDescription className="text-center">
                Please wait while we load your verification status...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">{getStatusIcon()}</div>
            <CardTitle className={`text-2xl ${getStatusColor()}`}>
              {getStatusTitle()}
            </CardTitle>
            <CardDescription className="text-center">
              {getStatusMessage()}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Loading State */}
            {overallStatus === 'loading' && (
              <div className="text-center">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm text-blue-700">
                    Loading your verification status...
                  </p>
                </div>
              </div>
            )}

            {/* Success State */}
            {overallStatus === 'success' && (
              <div className="space-y-4 text-center">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="text-sm text-green-700">
                    {session?.user
                      ? 'Your email has been verified successfully. We are taking you to the next step for your account.'
                      : 'Your email has been verified successfully. Sign in to track your approval status and access your account once it is approved.'}
                  </p>
                </div>
                {isRedirecting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Spinner size="sm" className="text-blue-500" />
                    <span className="text-sm text-blue-600">
                      Redirecting...
                    </span>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      setIsRedirecting(true);
                      router.push(postVerificationPath);
                    }}
                    className="w-full"
                  >
                    {postVerificationButtonLabel}
                  </Button>
                )}
              </div>
            )}

            {/* Has Token - Show Verify Button */}
            {overallStatus === 'has-token' && (
              <div className="space-y-4 text-center">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm text-blue-700">
                    We found a verification token in your link and are verifying
                    it now.
                  </p>
                </div>
                <Button
                  onClick={handleVerifyToken}
                  disabled={verificationStatus === 'verifying'}
                  className="w-full"
                >
                  {verificationStatus === 'verifying'
                    ? 'Verifying...'
                    : 'Retry Verification'}
                </Button>
              </div>
            )}

            {/* Error/Expired State */}
            {(overallStatus === 'expired' || overallStatus === 'error') && (
              <div className="space-y-4">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-700">
                    {overallStatus === 'expired'
                      ? 'Your verification link has expired. Please request a new one below.'
                      : 'There was an error verifying your email. You can request a new verification link below.'}
                  </p>
                </div>

                <form onSubmit={handleResendVerification} className="space-y-4">
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    isLoading={
                      resendLoading || resendVerificationMutation.isPending
                    }
                    loadingText="Sending..."
                    disabled={!email}
                  >
                    Send New Verification Email
                  </Button>

                  {resendMessage && (
                    <div
                      className={`text-center text-sm ${
                        resendMessage.includes('sent')
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {resendMessage}
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Already Verified State */}
            {overallStatus === 'already-verified' && (
              <div className="space-y-4 text-center">
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-700">
                    Your email is already verified. Continue to the next step
                    for your account.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setIsRedirecting(true);
                    router.push(postVerificationPath);
                  }}
                  className="w-full"
                >
                  {postVerificationButtonLabel}
                </Button>
              </div>
            )}

            {/* No Token State - Request Verification */}
            {overallStatus === 'no-token' && (
              <div className="space-y-4 text-center">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm text-blue-700">
                    Please enter your email address to receive a verification
                    link.
                  </p>
                </div>
                <form onSubmit={handleResendVerification} className="space-y-4">
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    isLoading={
                      resendLoading || resendVerificationMutation.isPending
                    }
                    loadingText="Sending..."
                    disabled={!email}
                  >
                    Send Verification Email
                  </Button>

                  {resendMessage && (
                    <div
                      className={`text-center text-sm ${
                        resendMessage.includes('sent')
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {resendMessage}
                    </div>
                  )}
                </form>
              </div>
            )}

            <div className="text-center">
              <Button
                variant="link"
                onClick={() => router.push('/register')}
                className="text-sm"
              >
                Need a new account? Register here
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <PageLoading
          title="Verifying your email"
          description="Checking your verification status"
        />
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
