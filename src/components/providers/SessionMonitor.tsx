"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function SessionMonitor() {
  const { data: session, update } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Only monitor if user is logged in
    if (!session?.user?.id) return;

    // Check for session updates every 30 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/auth/refresh-session", {
          method: "POST",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();

          // If user data has changed, update session
          if (data.user && session?.user) {
            const hasChanges =
              data.user.role !== session.user.role ||
              data.user.status !== session.user.status ||
              data.user.isEmailVerified !== session.user.isEmailVerified ||
              data.user.isActive !== (session.user as any).isActive;

            if (hasChanges) {
              console.log("Session data changed, updating...");
              await update();
              // Optionally refresh the page to ensure middleware picks up changes
              router.refresh();
            }
          }
        }
      } catch (error) {
        console.error("Error checking session updates:", error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [session, update, router]);

  return null; // This component doesn't render anything
}
