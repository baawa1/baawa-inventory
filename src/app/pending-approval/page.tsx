"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
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
import { useUserStatusValidation } from "@/hooks/useUserStatusValidation";

export default function PendingApprovalPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Use the custom hook for all session validation logic
  const {
    userStatus,
    isRefreshing,
    hasTriedRefresh,
    refreshUserStatus,
    isLoading,
  } = useUserStatusValidation({
    redirectOnApproved: true,
    autoRefresh: true,
  });

  // Handle redirects in useEffect to avoid setState during render
  useEffect(() => {
    if (status === "loading" || isLoading) return; // Wait for loading to complete

    // Redirect unauthenticated users to login
    if (status === "unauthenticated" || !session) {
      router.push("/login");
      return;
    }

    // Only allow users with specific statuses to access this page
    const allowedStatuses = ["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"];
    if (session && userStatus && !allowedStatuses.includes(userStatus)) {
      // If user is APPROVED, they should be redirected to dashboard (handled by useUserStatusValidation)
      // If user has any other status, redirect to login
      if (userStatus !== "APPROVED") {
        router.push("/login");
      }
    }
  }, [status, session, userStatus, router, isLoading]);

  // Show loading state
  if (isLoading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Clock className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading state during redirects
  if (status === "unauthenticated" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Clock className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Show loading state for unauthorized access
  const allowedStatuses = ["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"];
  if (
    session &&
    userStatus &&
    !allowedStatuses.includes(userStatus) &&
    userStatus !== "APPROVED"
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-4" />
          <p className="text-gray-600">Access denied. Redirecting...</p>
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
        console.warn("Unknown user status:", userStatus, "Session:", session);
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
              "We&apos;re unable to determine your account status. Please contact support.",
          },
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        {/* Debug panel for development */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
            <h3 className="font-semibold text-yellow-800 mb-2">Debug Info:</h3>
            <p>Session Status: {status}</p>
            <p>User Status: {userStatus || "undefined"}</p>
            <p>Session User ID: {session?.user?.id || "undefined"}</p>
            <p>
              Email Verified:{" "}
              {session?.user?.emailVerified?.toString() || "undefined"}
            </p>
            <p>Has Tried Refresh: {hasTriedRefresh.toString()}</p>
          </div>
        )}

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
                  <li>
                    You&apos;ll receive an email notification when approved
                  </li>
                  <li>Once approved, you can log in to access the system</li>
                </ol>
              </div>
            )}

            {(userStatus === "PENDING" || userStatus === "VERIFIED") && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-blue-700">
                    You&apos;ll be notified by email once your account is
                    approved
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
