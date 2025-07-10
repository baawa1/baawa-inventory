"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, AlertCircle, Mail } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // const { data: session, update } = useSession();

  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "expired" | "already-verified"
  >("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const token = searchParams.get("token");

  const verifyEmailToken = useCallback(
    async (verificationToken: string) => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: verificationToken }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message);

          // Set a flag that email was just verified so pending approval page can refresh
          sessionStorage.setItem("emailJustVerified", "true");

          // If user is logged in and we get shouldRefreshSession, refresh the session
          // if (session && data.shouldRefreshSession) {
          //   try {
          //     // Use Auth.js v5 update method to refresh the session from the server
          //     await update();
          //   } catch (error) {
          //     console.error("Error updating session:", error);
          //   }
          // }

          // Redirect to pending approval page after 3 seconds
          setTimeout(() => {
            router.push("/pending-approval");
          }, 3000);
        } else {
          if (data.error.includes("expired")) {
            setStatus("expired");
          } else if (data.error.includes("already verified")) {
            setStatus("already-verified");
          } else {
            setStatus("error");
          }
          setMessage(data.error);
        }
      } catch (error) {
        console.error("Error verifying email:", error);
        setStatus("error");
        setMessage("An error occurred while verifying your email");
      }
    },
    [router]
  );

  // Only verify token on mount if token exists - no API calls in useEffect
  useEffect(() => {
    if (token) {
      verifyEmailToken(token);
    } else {
      setStatus("error");
      setMessage("No verification token provided");
    }
  }, [token, verifyEmailToken]);

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setResendLoading(true);
    setResendMessage("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendMessage("Verification email sent! Please check your inbox.");
      } else {
        setResendMessage(data.error || "Failed to send verification email");
      }
    } catch {
      setResendMessage("Failed to send verification email. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return <Clock className="h-16 w-16 text-blue-500 animate-spin" />;
      case "success":
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case "error":
      case "expired":
        return <XCircle className="h-16 w-16 text-red-500" />;
      case "already-verified":
        return <AlertCircle className="h-16 w-16 text-yellow-500" />;
      default:
        return <Mail className="h-16 w-16 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "loading":
        return "text-blue-600";
      case "success":
        return "text-green-600";
      case "error":
      case "expired":
        return "text-red-600";
      case "already-verified":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">{getStatusIcon()}</div>
            <CardTitle className={`text-2xl ${getStatusColor()}`}>
              {status === "loading" && "Verifying Email..."}
              {status === "success" && "Email Verified!"}
              {status === "error" && "Verification Failed"}
              {status === "expired" && "Token Expired"}
              {status === "already-verified" && "Already Verified"}
            </CardTitle>
            <CardDescription className="text-center">{message}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {status === "success" && (
              <div className="text-center space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700">
                    Your email has been verified successfully! Your account is
                    now pending admin approval. You will receive an email
                    notification once your account is approved.
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/pending-approval")}
                  className="w-full"
                >
                  Continue to Pending Approval
                </Button>
              </div>
            )}

            {(status === "expired" || status === "error") && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">
                    {status === "expired"
                      ? "Your verification link has expired. Please request a new one below."
                      : "There was an error verifying your email. You can request a new verification link below."}
                  </p>
                </div>

                <form onSubmit={handleResendVerification} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={resendLoading || !email}
                    className="w-full"
                  >
                    {resendLoading
                      ? "Sending..."
                      : "Send New Verification Email"}
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
            )}

            {status === "already-verified" && (
              <div className="text-center space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-700">
                    Your email is already verified. Please check your account
                    status.
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/pending-approval")}
                  className="w-full"
                >
                  Check Account Status
                </Button>
              </div>
            )}

            <div className="text-center">
              <Button
                variant="link"
                onClick={() => router.push("/register")}
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
