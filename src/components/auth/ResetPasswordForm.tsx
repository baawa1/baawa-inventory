'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useTokenValidation } from '@/hooks/api/useTokenValidation';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .max(128, 'Password must be less than 128 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&)'
      ),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  className?: string;
}

export function ResetPasswordForm({ className }: ResetPasswordFormProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordFormContent className={className} />
    </Suspense>
  );
}

function ResetPasswordFormContent({ className }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [hasValidatedToken, setHasValidatedToken] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const tokenValidationMutation = useTokenValidation();

  useEffect(() => {
    const validateToken = async () => {
      if (!token || hasValidatedToken || isValidatingToken) {
        if (!token) {
          setIsValidToken(false);
        }
        return;
      }

      try {
        setIsValidatingToken(true);
        setHasValidatedToken(true);
        const result = await tokenValidationMutation.mutateAsync({ token });
        setIsValidToken(result.valid);
      } catch (error) {
        console.error('Token validation error:', error);

        // Handle specific error types
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();
          if (
            errorMessage.includes('429') ||
            errorMessage.includes('rate limit')
          ) {
            setError(
              'Too many validation attempts. Please wait a moment and try again.'
            );
          } else if (errorMessage.includes('failed to fetch')) {
            setError(
              'Network error. Please check your connection and try again.'
            );
          } else {
            setError('Token validation failed. Please try again.');
          }
        }

        setIsValidToken(false);
      } finally {
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [token, hasValidatedToken, isValidatingToken]); // Removed tokenValidationMutation from dependencies

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }

      // Redirect to login with success message
      router.push('/login?message=password-reset-success');
    } catch (error) {
      console.error('Reset password error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null || isValidatingToken) {
    return (
      <div className={className}>
        <Card className="mx-auto max-w-sm">
          <CardHeader>
            <CardTitle className="text-xl">Loading...</CardTitle>
            <CardDescription>Validating your reset token</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className={className}>
        <Card className="mx-auto max-w-sm">
          <CardHeader>
            <CardTitle className="text-xl">Invalid Reset Link</CardTitle>
            <CardDescription data-testid="token-error">
              This password reset link is invalid or has expired
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Password reset links expire after 1 hour. Please request a new
                reset link.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/forgot-password')}
              >
                Request New Reset Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Set New Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              data-testid="reset-password-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="password-input"
                        type="password"
                        placeholder="Enter new password"
                        required
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="confirm-password-input"
                        type="password"
                        placeholder="Confirm new password"
                        required
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div
                  data-testid="password-mismatch-error"
                  className="text-destructive bg-destructive/10 rounded-md p-3 text-sm"
                >
                  {error}
                </div>
              )}

              <Button
                data-testid="reset-button"
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
