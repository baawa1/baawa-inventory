"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function PendingApprovalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user?.status === "APPROVED") {
      router.push("/dashboard");
      return;
    }
  }, [session, status, router]);

  const handleLogout = () => {
    router.push("/logout");
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null; // Will redirect
  }

  const getStatusIcon = () => {
    switch (session?.user?.status) {
      case "PENDING":
        return <Clock className="h-16 w-16 text-yellow-500" />;
      case "APPROVED":
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case "REJECTED":
        return <AlertCircle className="h-16 w-16 text-red-500" />;
      default:
        return <Clock className="h-16 w-16 text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (session?.user?.status) {
      case "PENDING":
        return {
          title: "Account Pending Approval",
          description:
            "Your account is currently under review. An administrator will approve your access soon.",
        };
      case "REJECTED":
        return {
          title: "Account Access Denied",
          description:
            "Your account access has been denied. Please contact support for more information.",
        };
      default:
        return {
          title: "Account Status Unknown",
          description:
            "There seems to be an issue with your account status. Please contact support.",
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">{getStatusIcon()}</div>
            <CardTitle className="text-2xl font-bold">
              {statusInfo.title}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {statusInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Logged in as:{" "}
                <span className="font-medium">{session?.user?.email}</span>
              </p>
              <p className="text-sm text-gray-500">
                Role: <span className="font-medium">{session?.user?.role}</span>
              </p>
              <p className="text-sm text-gray-500">
                Status:{" "}
                <span className="font-medium">{session?.user?.status}</span>
              </p>
            </div>

            {session?.user?.status === "PENDING" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  Your account registration was successful! Please wait for an
                  administrator to approve your access.
                </p>
              </div>
            )}

            {session?.user?.status === "REJECTED" && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">
                  If you believe this is an error, please contact our support
                  team for assistance.
                </p>
              </div>
            )}

            <Button onClick={handleLogout} variant="outline" className="w-full">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
