"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function SessionMonitor() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    // Only monitor if user is logged in
    if (!session?.user?.id) return;

    // Check for session updates every 2 minutes instead of 30 seconds
    const interval = setInterval(async () => {
      try {
        // Prevent multiple simultaneous checks
        const now = Date.now();
        if (now - lastCheckRef.current < 60000) return; // Minimum 1 minute between checks
        lastCheckRef.current = now;

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
              data.user.isEmailVerified !== session.user.isEmailVerified;

            if (hasChanges) {
              console.log("Session data changed, updating...", {
                oldRole: session.user.role,
                newRole: data.user.role,
                oldStatus: session.user.status,
                newStatus: data.user.status,
              });
              await update();
              // Only refresh page for critical status changes
              if (data.user.status !== session.user.status) {
                router.refresh();
              }
            }
          }
        }
      } catch (error) {
        console.error("Error checking session updates:", error);
      }
    }, 120000); // Check every 2 minutes instead of 30 seconds

    return () => clearInterval(interval);
  }, [session, update, router]);

  return null; // This component doesn't render anything
}
