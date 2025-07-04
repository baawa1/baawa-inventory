"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft } from "lucide-react";
import { useLogout } from "@/hooks/useLogout";
import Link from "next/link";

export default function LogoutPage() {
  const { logout, isLoggingOut } = useLogout();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Confirm Logout</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Are you sure you want to log out of your account?
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full"
            variant="destructive"
          >
            {isLoggingOut ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4 mr-2" />
                Confirm Logout
              </>
            )}
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full"
            disabled={isLoggingOut}
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
