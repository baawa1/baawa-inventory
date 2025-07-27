import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '../auth';
import { authorizeUserForRoute } from '@/lib/auth/roles';
import type { UserRole, UserStatus } from '@/types/user';
import { generateSecurityHeaders } from '@/lib/security-headers';

export default auth((req: NextRequest & { auth: any }) => {
  const token = req.auth;
  const { pathname } = req.nextUrl;

  // Public routes that don't require authentication
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

  // Allow public routes without any checks
  if (publicRoutes.includes(pathname)) {
    const response = NextResponse.next();
    const securityHeaders = generateSecurityHeaders();

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  // If no token, redirect to login
  if (!token?.user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Extract user information from token
  const userRole = token.user?.role || (token.role as UserRole);
  const userStatus = token.user?.status || (token.status as UserStatus);
  const isEmailVerified = Boolean(
    token.user?.isEmailVerified || token.isEmailVerified
  );

  // Debug logging removed for production

  // Helper function to safely redirect and prevent loops
  const safeRedirect = (targetPath: string, _reason: string) => {
    if (pathname === targetPath) {
      // Already on target path, allow access to prevent redirect loops
      return NextResponse.next();
    }
    // Debug logging removed for production
    return NextResponse.redirect(new URL(targetPath, req.url));
  };

  // Authentication Flow Logic:
  // 1. PENDING users → check-email page (if email not verified) or pending-approval page
  // 2. VERIFIED users → pending-approval page (email verified, awaiting admin approval)
  // 3. APPROVED users → dashboard (full access)
  // 4. REJECTED/SUSPENDED users → unauthorized page

  // Check user status first, then handle email verification for PENDING users
  if (userStatus === 'PENDING') {
    // PENDING users need email verification first
    if (!isEmailVerified) {
      return safeRedirect('/check-email', 'Email not verified');
    } else {
      // Email verified but still pending admin approval
      return safeRedirect(
        '/pending-approval',
        'User status is PENDING (needs admin approval)'
      );
    }
  }

  if (userStatus === 'VERIFIED') {
    // Email verified but not yet approved by admin
    return safeRedirect(
      '/pending-approval',
      'User status is VERIFIED (needs admin approval)'
    );
  }

  if (userStatus === 'REJECTED' || userStatus === 'SUSPENDED') {
    return safeRedirect('/unauthorized', `User status is ${userStatus}`);
  }

  // At this point, user should be APPROVED
  if (userStatus !== 'APPROVED') {
    return safeRedirect('/unauthorized', `Invalid user status: ${userStatus}`);
  }

  // Check role-based access for protected routes
  const isAuthorized = authorizeUserForRoute(pathname, userRole);
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
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest file)
     * - sw.js (service worker file)
     * - browserconfig.xml (IE/Edge config file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|browserconfig.xml).*)',
  ],
};
