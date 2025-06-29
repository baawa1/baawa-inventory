"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle,
  Mail,
  User,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function PendingApprovalPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasTriedRefresh, setHasTriedRefresh] = useState(false);

  // Function to refresh user status from the server
  const refreshUserStatus = async () => {
    if (!session?.user?.id) return;

    setIsRefreshing(true);
    setHasTriedRefresh(true);

    try {
      // Use NextAuth's update() to trigger a fresh JWT token fetch
      await update();
      console.log("Session refreshed successfully");
    } catch (error) {
      console.error("Error refreshing session:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  useEffect(() => {
    if (session?.user?.status) {
      setUserStatus(session.user.status);
    }
  }, [session]);

  // Automatically refresh session if user status is unknown or seems stale
  useEffect(() => {
    if (session && !hasTriedRefresh) {
      const shouldAutoRefresh =
        !userStatus || // No status detected
        (userStatus === "PENDING" &&
          sessionStorage.getItem("emailJustVerified")); // User just verified email but still shows PENDING

      if (shouldAutoRefresh) {
        console.log("Auto-refreshing session due to potentially stale status");
        refreshUserStatus();

        // Clear the flag after attempting refresh
        if (sessionStorage.getItem("emailJustVerified")) {
          sessionStorage.removeItem("emailJustVerified");
        }
      }
    }
  }, [session, userStatus, hasTriedRefresh]);

  // Redirect if user is already approved
  useEffect(() => {
    if (userStatus === "APPROVED") {
      router.push("/dashboard");
    }
  }, [userStatus, router]);

  // Show loading state AFTER all hooks are called
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Clock className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const getStatusInfo = () => {
    switch (userStatus) {
      case "PENDING":
        return {
          icon: <Clock className="h-16 w-16 text-yellow-500" />,
          title: "Email Verification Required",
          titleColor: "text-yellow-600",
          description: "Please check your email and verify your account",
          statusCard: {
            bgColor: "bg-yellow-50 border-yellow-200",
            iconColor: "text-yellow-600",
            textColor: "text-yellow-700",
            icon: <Mail className="h-4 w-4" />,
            title: "Awaiting Email Verification",
            description:
              "Please check your email and click the verification link to continue.",
          },
        };
      case "VERIFIED":
        return {
          icon: <Clock className="h-16 w-16 text-blue-500" />,
          title: "Account Pending Approval",
          titleColor: "text-blue-600",
          description: "Your email has been verified successfully",
          statusCard: {
            bgColor: "bg-blue-50 border-blue-200",
            iconColor: "text-blue-600",
            textColor: "text-blue-700",
            icon: <User className="h-4 w-4" />,
            title: "Awaiting Admin Approval",
            description:
              "Your account is now pending approval from an administrator.",
          },
        };
      case "REJECTED":
        return {
          icon: <XCircle className="h-16 w-16 text-red-500" />,
          title: "Account Rejected",
          titleColor: "text-red-600",
          description: "Your account application has been rejected",
          statusCard: {
            bgColor: "bg-red-50 border-red-200",
            iconColor: "text-red-600",
            textColor: "text-red-700",
            icon: <XCircle className="h-4 w-4" />,
            title: "Application Rejected",
            description:
              "Your account application has been rejected. Please contact support for more information.",
          },
        };
      case "SUSPENDED":
        return {
          icon: <AlertTriangle className="h-16 w-16 text-orange-500" />,
          title: "Account Suspended",
          titleColor: "text-orange-600",
          description: "Your account has been temporarily suspended",
          statusCard: {
            bgColor: "bg-orange-50 border-orange-200",
            iconColor: "text-orange-600",
            textColor: "text-orange-700",
            icon: <AlertTriangle className="h-4 w-4" />,
            title: "Account Suspended",
            description:
              "Your account has been suspended. Please contact support to resolve this issue.",
          },
        };
      default:
        return {
          icon: <Clock className="h-16 w-16 text-gray-500" />,
          title: "Account Status Unknown",
          titleColor: "text-gray-600",
          description: "Please contact support for assistance",
          statusCard: {
            bgColor: "bg-gray-50 border-gray-200",
            iconColor: "text-gray-600",
            textColor: "text-gray-700",
            icon: <AlertTriangle className="h-4 w-4" />,
            title: "Status Unknown",
            description:
              "We're unable to determine your account status. Please contact support.",
          },
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">{statusInfo.icon}</div>
            <CardTitle className={`text-2xl ${statusInfo.titleColor}`}>
              {statusInfo.title}
            </CardTitle>
            <CardDescription className="text-center">
              {statusInfo.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {userStatus === "VERIFIED" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium text-green-700">
                    Email Verified
                  </p>
                </div>
                <p className="text-sm text-green-600">
                  Your email address has been successfully verified.
                </p>
              </div>
            )}

            <div
              className={`${statusInfo.statusCard.bgColor} border rounded-lg p-4`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <span className={statusInfo.statusCard.iconColor}>
                  {statusInfo.statusCard.icon}
                </span>
                <p
                  className={`text-sm font-medium ${statusInfo.statusCard.textColor}`}
                >
                  {statusInfo.statusCard.title}
                </p>
              </div>
              <p className={`text-sm ${statusInfo.statusCard.textColor}`}>
                {statusInfo.statusCard.description}
              </p>
            </div>

            {userStatus === "VERIFIED" && (
              <div className="space-y-3 text-sm text-gray-600">
                <h3 className="font-medium text-gray-900">
                  What happens next:
                </h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>An administrator will review your account</li>
                  <li>You'll receive an email notification when approved</li>
                  <li>Once approved, you can log in to access the system</li>
                </ol>
              </div>
            )}

            {(userStatus === "PENDING" || userStatus === "VERIFIED") && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-blue-700">
                    You'll be notified by email once your account is approved
                  </p>
                </div>
              </div>
            )}

            <div className="text-center pt-4 border-t space-y-2">
              {!userStatus && (
                <Button
                  onClick={refreshUserStatus}
                  disabled={isRefreshing}
                  variant="outline"
                  className="w-full mb-2"
                >
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Checking Status...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Status
                    </>
                  )}
                </Button>
              )}

              <Button onClick={() => router.push("/login")} className="w-full">
                Back to Login
              </Button>

              <Button
                variant="link"
                onClick={() => router.push("/")}
                className="text-sm"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
