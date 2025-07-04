"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useLogout } from "@/hooks/useLogout";

/**
 * Immediate logout component - automatically logs out when mounted
 * This should be used sparingly and only in specific scenarios like:
 * - Security-triggered logouts
 * - Session expiration
 * - Administrative actions
 */
export default function ImmediateLogoutPage() {
  const { logout, isLoggingOut } = useLogout();

  useEffect(() => {
    // Only trigger logout if not already logging out
    if (!isLoggingOut) {
      logout();
    }
  }, [logout, isLoggingOut]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Logging out...</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Please wait while we securely log you out.
          </p>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  );
}
