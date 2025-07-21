/**
 * PWA Registration Component
 * Handles service worker registration and PWA install prompts
 */

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconDownload, IconX } from "@tabler/icons-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function PWAManager() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Register service worker
    if ("serviceWorker" in navigator) {
      registerServiceWorker();
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Debug logging removed for production
      e.preventDefault();
      setDeferredPrompt(e);

      // Show install prompt after a delay if not already installed
      setTimeout(() => {
        if (!isInstalled) {
          setShowInstallPrompt(true);
        }
      }, 30000); // Show after 30 seconds
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      // Debug logging removed for production
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      toast.success("App installed successfully!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isInstalled]);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New content available
              toast.info("New version available! Refresh to update.", {
                action: {
                  label: "Refresh",
                  onClick: () => window.location.reload(),
                },
              });
            }
          });
        }
      });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data.type === "SYNC_OFFLINE_TRANSACTIONS") {
          // Trigger offline transaction sync
          // Debug logging removed for production
          // This would trigger the useOffline hook sync
        }
      });

      // Debug logging removed for production
    } catch (error) {
      logger.error("Service Worker registration failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        // Debug logging removed for production
      } else {
        // Debug logging removed for production
      }

      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      logger.error("Failed to show install prompt", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg border-2 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <IconDownload className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Install BaaWA POS</h3>
              <p className="text-xs text-muted-foreground">
                Get the full app experience
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismissInstall}
            className="h-6 w-6 p-0"
          >
            <IconX className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-xs text-muted-foreground mb-3">
          • Works offline • Faster loading • Desktop/mobile shortcuts • Push
          notifications
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={handleInstallClick} className="flex-1">
            Install
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismissInstall}
            className="flex-1"
          >
            Not now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook to check PWA installation status
export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Check if installable
    const handleBeforeInstallPrompt = () => {
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  return { isInstalled, isInstallable };
}
