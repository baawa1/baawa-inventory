"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(
    null
  );
  const router = useRouter();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    setVerificationEmail(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        // Handle specific error types from auth.ts
        if (result.error.includes("UNVERIFIED_EMAIL")) {
          setError("Please verify your email address before logging in.");
          setVerificationEmail(data.email);
        } else if (result.error.includes("PENDING_VERIFICATION")) {
          setError(
            "Your account is pending email verification. Please check your email."
          );
          setVerificationEmail(data.email);
        } else if (result.error.includes("PENDING_APPROVAL")) {
          setError(
            "Your email is verified but your account is pending admin approval. You will be notified once approved."
          );
        } else if (result.error.includes("ACCOUNT_REJECTED")) {
          setError(
            "Your account has been rejected. Please contact support for more information."
          );
        } else if (result.error.includes("ACCOUNT_SUSPENDED")) {
          setError("Your account has been suspended. Please contact support.");
        } else if (result.error.includes("ACCOUNT_INACTIVE")) {
          setError("Your account is inactive. Please contact support.");
        } else {
          setError("Invalid email or password");
        }
      } else if (result?.ok) {
        router.push(callbackUrl || "/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) return;

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail }),
      });

      if (response.ok) {
        setError("Verification email sent! Please check your inbox.");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to send verification email");
      }
    } catch {
      setError("Failed to send verification email. Please try again.");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            data-testid="login-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4"
          >
            {/* Validation errors container for E2E tests */}
            {Object.keys(form.formState.errors).length > 0 && (
              <div
                data-testid="validation-errors"
                className="bg-destructive/15 text-destructive text-sm p-3 rounded-md"
              >
                {Object.entries(form.formState.errors).map(([field, error]) => (
                  <div key={field}>{error?.message}</div>
                ))}
              </div>
            )}

            {error && (
              <div
                data-testid="login-error"
                className="bg-destructive/15 text-destructive text-sm p-3 rounded-md"
              >
                {error}
                {verificationEmail && (
                  <Button
                    type="button"
                    variant="link"
                    className="mt-2 h-auto p-0 text-sm text-destructive hover:text-destructive/80"
                    onClick={handleResendVerification}
                  >
                    Resend verification email
                  </Button>
                )}
              </div>
            )}

            {/* Specific error message containers for E2E tests */}
            {error?.includes("suspended") && (
              <div
                data-testid="suspended-message"
                className="bg-destructive/15 text-destructive text-sm p-3 rounded-md"
              >
                {error}
              </div>
            )}

            {error?.includes("locked") && (
              <div
                data-testid="lockout-message"
                className="bg-destructive/15 text-destructive text-sm p-3 rounded-md"
              >
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="email-input"
                      type="email"
                      placeholder="name@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="password-input"
                      type="password"
                      placeholder="Enter your password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              data-testid="login-button"
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-primary hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
