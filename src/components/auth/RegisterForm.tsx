"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import { UserRole } from "@/types/app";
import { passwordSchema } from "@/lib/validations/common";

const registerSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: passwordSchema, // Use the same password schema as backend
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  defaultRole?: UserRole;
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
          // Remove role from request since backend ignores it
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to create account";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If we can't parse JSON, use the response status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      await response.json();

      setSuccess(true);
      form.reset();

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/check-email?email=${encodeURIComponent(data.email)}`);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-green-600">
            <h1>Check Your Email!</h1>
          </CardTitle>
          <CardDescription>
            We&apos;ve sent a verification link to your email address. Please
            check your inbox and click the link to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() =>
              router.push(
                `/check-email?email=${encodeURIComponent(form.getValues("email") || "")}`
              )
            }
            className="w-full"
          >
            Go to Email Verification
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          <h1>Create Account</h1>
        </CardTitle>
        <CardDescription>
          Enter your information to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            data-testid="registration-form"
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
                data-testid="error-message"
                className="bg-destructive/15 text-destructive text-sm p-3 rounded-md"
              >
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="firstName-input"
                      placeholder="John"
                      required
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="lastName-input"
                      placeholder="Doe"
                      required
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      required
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
                      placeholder="Enter a strong password (12+ chars)"
                      required
                      {...field}
                    />
                  </FormControl>
                  <FormMessage data-testid="password-error" />
                  <div className="text-xs text-muted-foreground mt-1">
                    Password must be at least 12 characters with uppercase,
                    lowercase, number, and special character
                  </div>
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
                      data-testid="confirmPassword-input"
                      type="password"
                      placeholder="Confirm your password"
                      required
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              data-testid="register-button"
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
