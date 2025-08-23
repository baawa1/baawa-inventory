'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function NavigationLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const pathname = usePathname();

  useEffect(() => {
    // Start loading when pathname changes
    setIsLoading(true);

    // Clear any existing timeout
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
    }

    // Stop loading after a short delay
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    setLoadingTimeout(timeout);

    return () => {
      clearTimeout(timeout);
    };
  }, [pathname]);

  // Also listen for link clicks to start loading immediately
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') || target.closest('[role="link"]');

      if (link) {
        const href = link.getAttribute('href');
        if (
          href &&
          !href.startsWith('#') &&
          !href.startsWith('mailto:') &&
          !href.startsWith('tel:')
        ) {
          setIsLoading(true);
        }
      }
    };

    document.addEventListener('click', handleLinkClick);

    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 right-0 left-0 z-50">
      <div className="relative h-1 overflow-hidden bg-gradient-to-r from-primary via-accent to-secondary">
        <div
          className="absolute top-0 left-0 h-full w-1/3 bg-primary-foreground opacity-75 shadow-lg"
          style={{
            animation: 'loading 1.2s ease-in-out infinite',
          }}
        />
      </div>
      <style jsx>{`
        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  );
}
