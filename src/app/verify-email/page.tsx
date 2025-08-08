'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
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
import { Clock, CheckCircle, XCircle, AlertCircle, Mail } from 'lucide-react';
import { useEmailVerification } from '@/hooks/api/useEmailVerification';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, updateSession } = useSessionUpdate();

  // Add hydration state to prevent SSR/client mismatch
  const [isHydrated, setIsHydrated] = useState(false);

  const [verificationStatus, setVerificationStatus] = useState<
    'idle' | 'verifying' | 'success' | 'error' | 'expired'
  >('idle');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const token = searchParams.get('token');
  const emailVerificationMutation = useEmailVerification();

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
    if (session?.user?.email && !email) {
      setEmail(session.user.email);
    }
  }, [session?.user?.email, email]);

  const handleVerifyToken = useCallback(async () => {
    if (!token) return;

    setVerificationStatus('verifying');
    setVerificationMessage('Verifying your email...');

    try {
      const data = await emailVerificationMutation.mutateAsync({ token });

      setVerificationStatus('success');
      setVerificationMessage(data.message);

      // Set flag for pending approval page
      sessionStorage.setItem('emailJustVerified', 'true');

      // Refresh session if user is logged in
      if (session && data.shouldRefreshSession) {
        try {
          await updateSession();
        } catch (error) {
          console.error('❌ Error updating session:', error);
        }
      }

      // Auto-redirect after successful verification
      setTimeout(() => {
        if (!isRedirecting) {
          setIsRedirecting(true);
          router.push('/pending-approval');
        }
      }, 2000);
    } catch (error) {
      console.error('❌ Error verifying email:', error);

      // Handle different error cases
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred';
      if (errorMessage.includes('expired')) {
        setVerificationStatus('expired');
      } else {
        setVerificationStatus('error');
      }
      setVerificationMessage(errorMessage);
    }
  }, [token, router, session, updateSession, isRedirecting]);

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setResendLoading(true);
    setResendMessage('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendMessage('Verification email sent! Please check your inbox.');
      } else {
        setResendMessage(data.error || 'Failed to send verification email');
      }
    } catch {
      setResendMessage('Failed to send verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (overallStatus) {
      case 'loading':
      case 'verifying':
        return <Clock className="h-16 w-16 animate-spin text-blue-500" />;
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
        return 'Click the button below to verify your email address.';
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
                <Clock className="h-16 w-16 animate-spin text-blue-500" />
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
                    Your email has been verified successfully! Your account is
                    now pending admin approval. You will receive an email
                    notification once your account is approved.
                  </p>
                </div>
                {isRedirecting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Clock className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-sm text-blue-600">
                      Redirecting to pending approval...
                    </span>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      setIsRedirecting(true);
                      router.push('/pending-approval');
                    }}
                    className="w-full"
                  >
                    Continue to Pending Approval
                  </Button>
                )}
              </div>
            )}

            {/* Has Token - Show Verify Button */}
            {overallStatus === 'has-token' && (
              <div className="space-y-4 text-center">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm text-blue-700">
                    We found a verification token in your link. Click below to
                    verify your email address.
                  </p>
                </div>
                <Button
                  onClick={handleVerifyToken}
                  disabled={verificationStatus === 'verifying'}
                  className="w-full"
                >
                  {verificationStatus === 'verifying'
                    ? 'Verifying...'
                    : 'Verify Email'}
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
                    disabled={resendLoading || !email}
                    className="w-full"
                  >
                    {resendLoading
                      ? 'Sending...'
                      : 'Send New Verification Email'}
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
                    Your email is already verified. You can continue to your
                    account.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setIsRedirecting(true);
                    router.push('/pending-approval');
                  }}
                  className="w-full"
                >
                  Continue to Account
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
                    disabled={resendLoading || !email}
                    className="w-full"
                  >
                    {resendLoading ? 'Sending...' : 'Send Verification Email'}
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
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
