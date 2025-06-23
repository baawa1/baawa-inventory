"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Clock, RefreshCw } from "lucide-react";

export default function CheckEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendEmail, setResendEmail] = useState(email || "");

  useEffect(() => {
    if (!email) {
      // If no email provided, redirect to register
      router.push("/register");
    }
  }, [email, router]);

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResendLoading(true);
    setResendMessage("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendMessage("Verification email sent! Please check your inbox.");
      } else {
        setResendMessage(data.error || "Failed to send verification email");
      }
    } catch (error) {
      setResendMessage("Failed to send verification email. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Mail className="h-16 w-16 text-blue-500" />
            </div>
            <CardTitle className="text-2xl text-blue-600">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-center">
              We've sent a verification link to your email address
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700 text-center">
                <strong>Email sent to:</strong>
                <br />
                {email}
              </p>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <h3 className="font-medium text-gray-900">Next steps:</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>You'll be redirected back to complete your registration</li>
                <li>Wait for admin approval to access your account</li>
              </ol>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-700">
                  The verification link expires in 24 hours
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-3">
                Didn't receive the email?
              </p>

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
                    onChange={(e) => setResendEmail(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={resendLoading || !resendEmail}
                  className="w-full"
                  variant="outline"
                >
                  {resendLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>

                {resendMessage && (
                  <div
                    className={`text-sm text-center ${
                      resendMessage.includes("sent")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {resendMessage}
                  </div>
                )}
              </form>
            </div>

            <div className="text-center pt-4 border-t">
              <Button
                variant="link"
                onClick={() => router.push("/login")}
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
