import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '#root/auth';
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

  // Public API routes that don't require authentication
  const publicApiRoutes = [
    '/api/health',
    '/api/auth/register',
    '/api/auth/login',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-email',
    '/api/auth/validate-reset-token',
  ];

  // Check if this is an API route
  const isApiRoute = pathname.startsWith('/api/');
  
  // Apply security headers to all responses
  const applySecurityHeaders = (response: NextResponse) => {
    const securityHeaders = generateSecurityHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  };

  // Handle public routes (pages and API)
  if (publicRoutes.includes(pathname) || publicApiRoutes.includes(pathname)) {
    return applySecurityHeaders(NextResponse.next());
  }

  // For API routes, handle authentication differently
  if (isApiRoute) {
    // Protected API routes require authentication
    if (!token?.user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401, headers: generateSecurityHeaders() }
      );
    }

    // Check user status for API routes
    const userStatus = token.user?.status || token.status;
    const isEmailVerified = Boolean(token.user?.isEmailVerified || token.isEmailVerified);

    if (!isEmailVerified || userStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Account not fully activated' }, 
        { status: 403, headers: generateSecurityHeaders() }
      );
    }

    // API route is authorized, continue with security headers
    return applySecurityHeaders(NextResponse.next());
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
      return applySecurityHeaders(NextResponse.next());
    }
    return applySecurityHeaders(NextResponse.redirect(new URL(targetPath, req.url)));
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
  return applySecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
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
     * 
     * SECURITY: API routes are now protected by middleware
     * Only exclude public API routes that don't need authentication
     */
    '/((?!_next/static|_next/image|favicon.png|manifest.json|sw.js|browserconfig.xml|logo|icon|apple-touch-icon.png|.*\\.svg|api/health|api/auth/register|api/auth/login|api/auth/forgot-password|api/auth/reset-password|api/auth/verify-email|api/auth/validate-reset-token).*)',
  ],
};
