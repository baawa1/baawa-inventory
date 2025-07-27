/**
 * Offline Page
 * Displayed when the user is offline and tries to access a non-cached page
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IconWifi, IconRefresh, IconHome } from '@tabler/icons-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 p-3">
            <IconWifi className="h-8 w-8 text-gray-400" />
          </div>
          <CardTitle className="text-xl">You&apos;re Offline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            It looks like you&apos;re not connected to the internet. Some
            features may not be available.
          </p>

          <div className="space-y-3">
            <Button className="w-full" onClick={() => window.location.reload()}>
              <IconRefresh className="mr-2 h-4 w-4" />
              Try Again
            </Button>

            <Link href="/pos" className="block">
              <Button variant="outline" className="w-full">
                <IconHome className="mr-2 h-4 w-4" />
                Go to POS (Offline Mode)
              </Button>
            </Link>
          </div>

          <div className="text-muted-foreground space-y-2 text-sm">
            <p>
              <strong>Available Offline:</strong>
            </p>
            <ul className="space-y-1 text-xs">
              <li>• Point of Sale transactions</li>
              <li>• Product search (cached)</li>
              <li>• Transaction history (local)</li>
              <li>• Offline transaction queuing</li>
            </ul>

            <p className="mt-3">
              <strong>Note:</strong> Transactions will be saved locally and
              synced when you&apos;re back online.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
