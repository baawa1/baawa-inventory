import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { authorizeUserForRoute } from "@/lib/auth/roles";
import type { UserRole, UserStatus } from "@/types/user";
import { generateSecurityHeaders } from "@/lib/security-headers";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
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

    // If no token, redirect to login (handled by authorized callback)
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Extract user information from token
    const userRole = token.role as UserRole;
    const userStatus = token.status as UserStatus;
    const emailVerified = token.emailVerified as boolean;
    const _userId = token.sub; // Prefixed with _ to indicate intentionally unused

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

    // Status-based access control
    // 1. Check email verification status
    if (emailVerified === false) {
      if (pathname !== "/verify-email" && pathname !== "/pending-approval") {
        return safeRedirect("/verify-email", "Unverified email");
      }
    }

    // 2. Handle users pending email verification
    if (userStatus === "PENDING") {
      if (pathname !== "/verify-email" && pathname !== "/pending-approval") {
        return safeRedirect("/verify-email", "Pending verification");
      }
    }

    // 3. Handle verified but unapproved users
    if (userStatus === "VERIFIED") {
      if (pathname !== "/pending-approval") {
        return safeRedirect("/pending-approval", "Waiting for approval");
      }
    }

    // 4. Handle rejected users
    if (userStatus === "REJECTED") {
      if (pathname !== "/pending-approval") {
        return safeRedirect("/pending-approval", "Account rejected");
      }
    }

    // 5. Handle suspended users
    if (userStatus === "SUSPENDED") {
      if (pathname !== "/pending-approval") {
        return safeRedirect("/pending-approval", "Account suspended");
      }
    }

    // 6. Only approved users can access protected routes
    if (userStatus !== "APPROVED") {
      const protectedRoutes = [
        "/dashboard",
        "/admin",
        "/reports",
        "/settings",
        "/inventory",
        "/pos",
      ];
      const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
      );

      if (isProtectedRoute) {
        return safeRedirect(
          "/pending-approval",
          `Non-approved user (${userStatus})`
        );
      }
    }

    // Role-based access control for approved users
    if (userStatus === "APPROVED") {
      if (!authorizeUserForRoute(userRole, pathname)) {
        return safeRedirect(
          "/unauthorized",
          `Access denied for ${userRole} to route ${pathname}`
        );
      }
    }

    // Apply security headers to all responses
    const response = NextResponse.next();
    const securityHeaders = generateSecurityHeaders();

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Define public routes
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

        // Allow access to public routes
        if (publicRoutes.includes(pathname)) {
          return true;
        }

        // Require authentication for all other routes
        if (!token) {
          return false;
        }

        // Additional token validation can be added here
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes are handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, icons, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
