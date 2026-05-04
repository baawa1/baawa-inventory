'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Clock } from 'lucide-react';
import { PageLoading } from '@/components/ui/loading';
import { useResendVerificationEmail } from '@/hooks/api/useEmailVerification';
function CheckEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const email = searchParams.get('email') || session?.user?.email || '';
  const verificationEmailSent = searchParams.get('sent') !== '0';
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendEmail, setResendEmail] = useState(email || '');
  const resendVerificationEmail = useResendVerificationEmail();

  useEffect(() => {
    if (email) {
      setResendEmail(email);
    }
  }, [email]);

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResendLoading(true);
    setResendMessage('');

    try {
      const data = await resendVerificationEmail.mutateAsync({
        email: resendEmail,
      });
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

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <Mail className="h-16 w-16 text-blue-500" />
            </div>
            <CardTitle className="text-2xl text-blue-600">
              Check Your Email
            </CardTitle>
            <CardDescription
              data-testid="email-sent-message"
              className="text-center"
            >
              {verificationEmailSent
                ? "We've sent a verification link to your email address"
                : "Your account was created, but we couldn't send the verification email yet"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div
              className={`rounded-lg border p-4 ${
                verificationEmailSent
                  ? 'border-blue-200 bg-blue-100'
                  : 'border-yellow-200 bg-yellow-50'
              }`}
            >
              <p
                className={`text-center text-sm ${
                  verificationEmailSent ? 'text-blue-700' : 'text-yellow-800'
                }`}
              >
                <strong>Email sent to:</strong>
                <br />
                {email}
              </p>
            </div>

            {!verificationEmailSent && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm text-yellow-800">
                  Request a new verification email below. Once it arrives, open
                  the link to finish confirming your account.
                </p>
              </div>
            )}

            <div className="space-y-3 text-sm">
              <h3 className="font-medium">Next steps:</h3>
              <ol className="list-inside list-decimal space-y-2">
                {verificationEmailSent ? (
                  <>
                    <li>Check your email inbox (and spam folder)</li>
                    <li>Click the verification link in the email</li>
                    <li>
                      You&apos;ll be redirected back to complete your
                      registration
                    </li>
                    <li>Wait for admin approval to access your account</li>
                  </>
                ) : (
                  <>
                    <li>Use the form below to request a new verification email</li>
                    <li>Open the latest verification link when it arrives</li>
                    <li>Sign in after verification to track your approval status</li>
                    <li>Wait for admin approval before accessing the dashboard</li>
                  </>
                )}
              </ol>
            </div>

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-700">
                  The verification link expires in 24 hours
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="mb-3 text-sm">Didn&apos;t receive the email?</p>

              <form onSubmit={handleResendVerification} className="space-y-3">
                <div>
                  <Label htmlFor="resend-email" className="sr-only">
                    Email
                  </Label>
                  <Input
                    id="resend-email"
                    type="email"
                    placeholder="Enter your email address"
                    value={resendEmail}
                    onChange={e => setResendEmail(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  variant="secondary"
                  isLoading={resendLoading || resendVerificationEmail.isPending}
                  loadingText="Sending..."
                  disabled={!resendEmail}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Verification Email
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

            <div className="border-t pt-4 text-center">
              <Button
                variant="link"
                onClick={() => router.push('/login')}
                className="text-sm"
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <PageLoading
          title="Loading email verification"
          description="Preparing your verification details"
        />
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
