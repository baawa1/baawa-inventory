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
import { Mail, Clock, RefreshCw } from 'lucide-react';
function CheckEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession(); // Add this line
  const email = searchParams.get('email') || session?.user?.email || '';
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendEmail, setResendEmail] = useState(email || '');

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
      const response = await fetch('/api/auth/verify-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
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
              We&apos;ve sent a verification link to your email address
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-100 p-4">
              <p className="text-center text-sm text-blue-700">
                <strong>Email sent to:</strong>
                <br />
                {email}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <h3 className="font-medium">Next steps:</h3>
              <ol className="list-inside list-decimal space-y-2">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>
                  You&apos;ll be redirected back to complete your registration
                </li>
                <li>Wait for admin approval to access your account</li>
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
                  disabled={resendLoading || !resendEmail}
                  className="w-full"
                  variant="secondary"
                >
                  {resendLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Resend Verification Email
                    </>
                  )}
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
    <Suspense fallback={<div>Loading...</div>}>
      <CheckEmailContent />
    </Suspense>
  );
}
