import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '#root/auth';
import { authorizeUserForRoute } from '@/lib/auth/roles';
import type { UserRole, UserStatus } from '@/types/user';
import { generateSecurityHeaders } from '@/lib/security-headers';

// Pre-compile route sets for O(1) lookup performance
const PUBLIC_ROUTES = new Set([
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
]);

const PUBLIC_API_ROUTES = new Set([
  '/api/health',
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/validate-reset-token',
]);

const NEXTAUTH_API_ROUTES = new Set([
  '/api/auth/session',
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/auth/error',
  '/api/auth/csrf',
  '/api/auth/providers',
  '/api/auth/callback',
  '/api/auth/refresh-session',
]);

const DEBUG_API_ROUTES = new Set([
  '/api/debug/session',
  '/api/debug-token',
  '/api/test-env',
  '/api/test-auth',
  '/api/test-middleware',
  '/api/test-email',
  '/api/test-data',
]);

// Route checking functions for better performance and readability
const isPublicRoute = (pathname: string): boolean => PUBLIC_ROUTES.has(pathname);
const isPublicApiRoute = (pathname: string): boolean => PUBLIC_API_ROUTES.has(pathname);
const isNextAuthApiRoute = (pathname: string): boolean => {
  // Exact match first for performance
  if (NEXTAUTH_API_ROUTES.has(pathname)) return true;
  // Check for callback patterns like /api/auth/callback/credentials
  return pathname.startsWith('/api/auth/callback/');
};
const isDebugApiRoute = (pathname: string): boolean => DEBUG_API_ROUTES.has(pathname);

export default auth((req: NextRequest & { auth: any }) => {
  const token = req.auth;
  const { pathname } = req.nextUrl;

  // Check if this is an API route - early determination for performance
  const isApiRoute = pathname.startsWith('/api/');
  
  // Apply security headers to all responses - optimized function
  const applySecurityHeaders = (response: NextResponse) => {
    const securityHeaders = generateSecurityHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  };

  // Fast route checking with early returns for performance
  // Handle public routes (pages and API) - O(1) lookup
  if (isPublicRoute(pathname) || isPublicApiRoute(pathname)) {
    return applySecurityHeaders(NextResponse.next());
  }

  // Allow NextAuth API routes to pass through - optimized pattern matching
  if (isNextAuthApiRoute(pathname)) {
    return applySecurityHeaders(NextResponse.next());
  }

  // Allow debug/development routes in development mode - O(1) lookup
  if (process.env.NODE_ENV === 'development' && isDebugApiRoute(pathname)) {
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
     * Optimized matcher: exclude static assets and let middleware handle route logic
     * This reduces the regex complexity and improves performance
     * 
     * Excluded patterns:
     * - _next/static (static files)
     * - _next/image (image optimization) 
     * - Common static files (favicon, manifest, etc.)
     * - Image files (*.svg, *.png, *.ico, etc.)
     */
    '/((?!_next/static|_next/image|favicon|manifest|sw\\.|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp)).*)',
  ],
};
