import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "../auth";
import { authorizeUserForRoute } from "@/lib/auth/roles";
import type { UserRole, UserStatus } from "@/types/user";
import { generateSecurityHeaders } from "@/lib/security-headers";

export default auth((req: NextRequest & { auth: any }) => {
  const token = req.auth;
  const { pathname } = req.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/login",
    "/logout",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/check-email",
    "/verify-email",
    "/pending-approval",
    "/unauthorized",
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
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Extract user information from token
  const userRole = token.user.role as UserRole;
  const userStatus = token.user.status as UserStatus;

  // Helper function to safely redirect and prevent loops
  const safeRedirect = (targetPath: string, reason: string) => {
    if (pathname === targetPath) {
      // Already on target path, allow access to prevent redirect loops
      return NextResponse.next();
    }
    if (process.env.NODE_ENV === "development") {
      console.log(
        `🔄 ${reason}: Redirecting from ${pathname} to ${targetPath}`
      );
    }
    return NextResponse.redirect(new URL(targetPath, req.url));
  };

  // Check user status
  if (userStatus === "PENDING") {
    return safeRedirect("/pending-approval", "User status is PENDING");
  }

  if (userStatus === "REJECTED" || userStatus === "SUSPENDED") {
    return safeRedirect("/unauthorized", `User status is ${userStatus}`);
  }

  // Check role-based access for protected routes
  const isAuthorized = authorizeUserForRoute(pathname, userRole);
  if (!isAuthorized) {
    return safeRedirect("/unauthorized", "Insufficient permissions");
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
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
