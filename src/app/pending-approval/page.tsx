"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, Mail, User } from "lucide-react";

export default function PendingApprovalPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Clock className="h-16 w-16 text-yellow-500" />
            </div>
            <CardTitle className="text-2xl text-yellow-600">
              Account Pending Approval
            </CardTitle>
            <CardDescription className="text-center">
              Your email has been verified successfully
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
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

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-700">
                  Awaiting Admin Approval
                </p>
              </div>
              <p className="text-sm text-yellow-600">
                Your account is now pending approval from an administrator.
              </p>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <h3 className="font-medium text-gray-900">What happens next:</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>An administrator will review your account</li>
                <li>You'll receive an email notification when approved</li>
                <li>Once approved, you can log in to access the system</li>
              </ol>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-700">
                  You'll be notified by email once your account is approved
                </p>
              </div>
            </div>

            <div className="text-center pt-4 border-t space-y-2">
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
