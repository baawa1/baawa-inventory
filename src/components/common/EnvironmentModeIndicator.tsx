'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { getEnvironmentModeIndicator } from '@/lib/utils/environment-mode';

export function EnvironmentModeIndicator() {
  const [indicator, setIndicator] = useState(() =>
    getEnvironmentModeIndicator({
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      nodeEnv: process.env.NODE_ENV,
    })
  );

  useEffect(() => {
    setIndicator(
      getEnvironmentModeIndicator({
        hostname: window.location.hostname,
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
        nodeEnv: process.env.NODE_ENV,
      })
    );
  }, []);

  if (!indicator.showIndicator || !indicator.label) {
    return null;
  }

  const title = indicator.hostname
    ? `Non-live environment detected: ${indicator.hostname}`
    : 'Non-live environment detected';

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[100] sm:right-6 sm:bottom-6">
      <Badge
        variant="outline"
        className="border-amber-700/80 bg-amber-300/95 px-3 py-1.5 text-[11px] font-bold tracking-[0.24em] text-amber-950 uppercase shadow-lg backdrop-blur-sm dark:border-amber-200/50 dark:bg-amber-300/95 dark:text-amber-950"
        data-testid="environment-mode-indicator"
        title={title}
      >
        {indicator.label}
      </Badge>
    </div>
  );
}
