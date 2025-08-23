import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '#root/auth';
import { authorizeUserForRoute } from '@/lib/auth/roles';
import type { UserRole, UserStatus } from '@/types/user';
import { generateSecurityHeaders } from '@/lib/security-headers';

export default auth((req: NextRequest & { auth: any }) => {
  const token = req.auth;
  const { pathname } = req.nextUrl;

  // Public routes that don't require authentication - check first for fastest response
  const publicRoutes = [
    '/',
    '/login',
    '/logout',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/check-email',
    '/verify-email',
    '/pending-approval',
    '/unauthorized',
  ];

  // Allow public routes without any checks - fastest path
  if (publicRoutes.includes(pathname)) {
    const response = NextResponse.next();
    const securityHeaders = generateSecurityHeaders();

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  // If no token, redirect to login immediately
  if (!token?.user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Extract user information from token once
  const userRole = token.user?.role || (token.role as UserRole);
  const userStatus = token.user?.status || (token.status as UserStatus);
  const isEmailVerified = Boolean(
    token.user?.isEmailVerified || token.isEmailVerified
  );

  // Helper function to safely redirect and prevent loops
  const safeRedirect = (targetPath: string, _reason: string) => {
    if (pathname === targetPath) {
      // Already on target path, allow access to prevent redirect loops
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL(targetPath, req.url));
  };

  // Check user status with early returns for fastest processing
  if (userStatus === 'PENDING') {
    if (!isEmailVerified) {
      return safeRedirect('/check-email', 'Email not verified');
    }
    return safeRedirect('/pending-approval', 'User status is PENDING (needs admin approval)');
  }

  if (userStatus === 'VERIFIED') {
    return safeRedirect('/pending-approval', 'User status is VERIFIED (needs admin approval)');
  }

  if (userStatus === 'REJECTED' || userStatus === 'SUSPENDED') {
    return safeRedirect('/unauthorized', `User status is ${userStatus}`);
  }

  // At this point, user should be APPROVED
  if (userStatus !== 'APPROVED') {
    return safeRedirect('/unauthorized', `Invalid user status: ${userStatus}`);
  }

  // Check role-based access for protected routes
  const isAuthorized = authorizeUserForRoute(userRole, pathname);
  if (!isAuthorized) {
    return safeRedirect('/unauthorized', 'Insufficient permissions');
  }

  // Allow access to the requested route
  const response = NextResponse.next();
  const securityHeaders = generateSecurityHeaders();

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.png (favicon file)
     * - manifest.json (PWA manifest file)
     * - sw.js (service worker file)
     * - browserconfig.xml (IE/Edge config file)
     * - logo (logo images)
     * - icon (icon files)
     * - apple-touch-icon.png (Apple touch icon)
     * - *.svg (SVG files)
     */
    '/((?!api|_next/static|_next/image|favicon.png|manifest.json|sw.js|browserconfig.xml|logo|icon|apple-touch-icon.png|.*\.svg).*)',
  ],
};
