import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '#root/auth.config';
import { authorizeUserForRoute } from '@/lib/auth/roles';
import type { UserRole, UserStatus } from '@/types/user';

// Type representing the auth session available in middleware
// Combines JWT token fields with user data
interface MiddlewareAuth {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    role?: UserRole;
    status?: UserStatus;
    isEmailVerified?: boolean;
  };
  // JWT token fields (also accessible at top level)
  role?: UserRole;
  status?: UserStatus;
  isEmailVerified?: boolean;
}

// Create Edge-compatible auth instance using only the config (no database providers)
const { auth } = NextAuth(authConfig);

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
  if (NEXTAUTH_API_ROUTES.has(pathname)) return true;
  return pathname.startsWith('/api/auth/callback/');
};
const isDebugApiRoute = (pathname: string): boolean => DEBUG_API_ROUTES.has(pathname);

/**
 * Edge-compatible security headers
 * Inlined to avoid importing heavy dependencies
 */
function generateSecurityHeaders(): Record<string, string> {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      isProduction
        ? "script-src 'self' 'unsafe-inline'"
        : "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https:",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      isProduction ? 'upgrade-insecure-requests' : '',
    ].filter(Boolean).join('; '),
    'Strict-Transport-Security': isProduction
      ? 'max-age=31536000; includeSubDomains; preload'
      : 'max-age=0',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'accelerometer=()',
      'gyroscope=()',
      'magnetometer=()',
      'fullscreen=(self)',
    ].join(', '),
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'credentialless',
  };
}

export default auth((req: NextRequest & { auth: MiddlewareAuth | null }) => {
  const token = req.auth;
  const { pathname } = req.nextUrl;

  const isApiRoute = pathname.startsWith('/api/');

  const applySecurityHeaders = (response: NextResponse) => {
    const securityHeaders = generateSecurityHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  };

  // Fast route checking with early returns for performance
  if (isPublicRoute(pathname) || isPublicApiRoute(pathname)) {
    return applySecurityHeaders(NextResponse.next());
  }

  if (isNextAuthApiRoute(pathname)) {
    return applySecurityHeaders(NextResponse.next());
  }

  if (process.env.NODE_ENV === 'development' && isDebugApiRoute(pathname)) {
    return applySecurityHeaders(NextResponse.next());
  }

  // For API routes, handle authentication differently
  if (isApiRoute) {
    if (!token?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: generateSecurityHeaders() }
      );
    }

    const userStatus = token.user?.status || token.status;
    const isEmailVerified = Boolean(token.user?.isEmailVerified || token.isEmailVerified);

    if (!isEmailVerified || userStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Account not fully activated' },
        { status: 403, headers: generateSecurityHeaders() }
      );
    }

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

  if (userStatus !== 'APPROVED') {
    return safeRedirect('/unauthorized', `Invalid user status: ${userStatus}`);
  }

  // Check role-based access for protected routes
  const isAuthorized = authorizeUserForRoute(userRole, pathname);
  if (!isAuthorized) {
    return safeRedirect('/unauthorized', 'Insufficient permissions');
  }

  return applySecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon|manifest|sw\\.|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp)).*)',
  ],
};
