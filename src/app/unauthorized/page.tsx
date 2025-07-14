"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Clock, XCircle, RefreshCw } from "lucide-react";

export default function UnauthorizedPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (status === "loading") return; // Still loading session

    if (!session?.user) {
      // No session, redirect to login
      router.push("/login");
      return;
    }

    const userStatus = session.user.status;
    const isEmailVerified = session.user.isEmailVerified;

    // Smart redirect based on user status
    if (userStatus === "PENDING") {
      if (!isEmailVerified) {
        setIsRedirecting(true);
        router.push("/check-email");
        return;
      } else {
        setIsRedirecting(true);
        router.push("/pending-approval");
        return;
      }
    }

    if (userStatus === "VERIFIED") {
      setIsRedirecting(true);
      router.push("/pending-approval");
      return;
    }

    // For REJECTED, SUSPENDED, or other invalid statuses, stay on this page
    // Only APPROVED users should be able to access protected routes
  }, [session, status, router]);

  // Show loading while redirecting
  if (isRedirecting || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Clock className="h-16 w-16 text-blue-500 animate-spin" />
            </div>
            <CardTitle className="text-2xl text-blue-600">
              Redirecting...
            </CardTitle>
            <CardDescription>
              Taking you to the appropriate page based on your account status.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Get user status for display
  const userStatus = session?.user?.status;

  const getStatusInfo = () => {
    switch (userStatus) {
      case "REJECTED":
        return {
          icon: <XCircle className="h-16 w-16 text-red-500" />,
          title: "Account Rejected",
          description: "Your account has been rejected by an administrator.",
          message: "Please contact support if you believe this is an error.",
          color: "text-red-600",
        };
      case "SUSPENDED":
        return {
          icon: <XCircle className="h-16 w-16 text-orange-500" />,
          title: "Account Suspended",
          description: "Your account has been temporarily suspended.",
          message: "Please contact support to resolve this issue.",
          color: "text-orange-600",
        };
      default:
        return {
          icon: <AlertTriangle className="h-16 w-16 text-yellow-500" />,
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          message:
            "This page requires elevated permissions. Please contact your administrator if you believe you should have access to this area.",
          color: "text-yellow-600",
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">{statusInfo.icon}</div>
          <CardTitle className={`text-2xl font-bold ${statusInfo.color}`}>
            {statusInfo.title}
          </CardTitle>
          <CardDescription data-testid="unauthorized-message">
            {statusInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>{statusInfo.message}</p>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild variant="ghost" className="w-full">
              <Link href="/">Go Home</Link>
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                console.log("🔄 Refresh button clicked");
                console.log("Current session before refresh:", session?.user);

                setIsRefreshing(true);
                try {
                  // Simply call NextAuth's update() - it will now fetch fresh data from DB
                  await update();
                  console.log("Session updated successfully");
                } catch (error) {
                  console.error("Error refreshing session:", error);
                } finally {
                  setIsRefreshing(false);
                }
              }}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Status
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
