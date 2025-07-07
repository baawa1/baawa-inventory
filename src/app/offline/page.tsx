/**
 * Offline Page
 * Displayed when the user is offline and tries to access a non-cached page
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconWifi, IconRefresh, IconHome } from "@tabler/icons-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center">
            <IconWifi className="h-8 w-8 text-gray-400" />
          </div>
          <CardTitle className="text-xl">You're Offline</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            It looks like you're not connected to the internet. Some features
            may not be available.
          </p>

          <div className="space-y-3">
            <Button className="w-full" onClick={() => window.location.reload()}>
              <IconRefresh className="h-4 w-4 mr-2" />
              Try Again
            </Button>

            <Link href="/pos" className="block">
              <Button variant="outline" className="w-full">
                <IconHome className="h-4 w-4 mr-2" />
                Go to POS (Offline Mode)
              </Button>
            </Link>
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Available Offline:</strong>
            </p>
            <ul className="text-xs space-y-1">
              <li>• Point of Sale transactions</li>
              <li>• Product search (cached)</li>
              <li>• Transaction history (local)</li>
              <li>• Offline transaction queuing</li>
            </ul>

            <p className="mt-3">
              <strong>Note:</strong> Transactions will be saved locally and
              synced when you're back online.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
