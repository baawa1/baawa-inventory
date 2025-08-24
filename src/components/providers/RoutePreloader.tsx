'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Critical routes that should be preloaded for instant navigation
const CRITICAL_ROUTES = ['/dashboard', '/pos', '/inventory', '/finance'];

// Role-specific routes to preload
const ROLE_ROUTES = {
  ADMIN: [
    '/admin',
    '/pos/analytics',
    '/inventory/products',
    '/finance/transactions',
    '/finance/reports',
    '/audit-logs',
  ],
  MANAGER: [
    '/pos/analytics',
    '/inventory/products',
    '/finance/transactions',
    '/inventory/reports',
  ],
  STAFF: ['/pos', '/inventory/products'],
};

export function RoutePreloader() {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    // Preload critical routes after a short delay to not block initial render
    const preloadRoutes = () => {
      // Always preload critical routes
      CRITICAL_ROUTES.forEach(route => {
        router.prefetch(route);
      });

      // Preload role-specific routes if user is authenticated
      if (session?.user?.role) {
        const roleRoutes =
          ROLE_ROUTES[session.user.role as keyof typeof ROLE_ROUTES] || [];
        roleRoutes.forEach(route => {
          router.prefetch(route);
        });
      }
    };

    // Delay preloading to prioritize initial page load
    const timeoutId = setTimeout(preloadRoutes, 1000);

    return () => clearTimeout(timeoutId);
  }, [router, session?.user?.role]);

  // This component doesn't render anything
  return null;
}
