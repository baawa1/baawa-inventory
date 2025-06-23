import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Define user statuses for better type safety
type UserStatus =
  | "PENDING"
  | "VERIFIED"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";
type UserRole = "ADMIN" | "MANAGER" | "EMPLOYEE";

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
      return NextResponse.next();
    }

    // If no token, redirect to login (handled by authorized callback)
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Extract user information from token
    const userRole = token.role as UserRole;
    const userStatus = token.status as UserStatus;
    const emailVerified = token.emailVerified as boolean;
    const userId = token.sub;

    // Log access attempt for debugging (only in development)
    if (process.env.NODE_ENV === "development") {
      console.log(
        `🔐 Middleware: User ${userId} (${userRole}/${userStatus}/${emailVerified ? "verified" : "unverified"}) accessing ${pathname}`
      );
    }

    // Status-based access control
    // 1. Check email verification status
    if (emailVerified === false) {
      if (pathname !== "/verify-email" && pathname !== "/pending-approval") {
        console.log(
          `📧 Redirecting unverified user to /verify-email from ${pathname}`
        );
        return NextResponse.redirect(new URL("/verify-email", req.url));
      }
    }

    // 2. Handle users pending email verification
    if (userStatus === "PENDING") {
      if (pathname !== "/verify-email" && pathname !== "/pending-approval") {
        console.log(
          `⏳ Redirecting pending user to /verify-email from ${pathname}`
        );
        return NextResponse.redirect(new URL("/verify-email", req.url));
      }
    }

    // 3. Handle verified but unapproved users
    if (userStatus === "VERIFIED") {
      if (pathname !== "/pending-approval") {
        console.log(
          `⏳ Redirecting verified user to /pending-approval from ${pathname}`
        );
        return NextResponse.redirect(new URL("/pending-approval", req.url));
      }
    }

    // 4. Handle rejected users
    if (userStatus === "REJECTED") {
      if (pathname !== "/pending-approval") {
        console.log(
          `❌ Redirecting rejected user to /pending-approval from ${pathname}`
        );
        return NextResponse.redirect(new URL("/pending-approval", req.url));
      }
    }

    // 5. Handle suspended users
    if (userStatus === "SUSPENDED") {
      if (pathname !== "/pending-approval") {
        console.log(
          `🚫 Redirecting suspended user to /pending-approval from ${pathname}`
        );
        return NextResponse.redirect(new URL("/pending-approval", req.url));
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
        console.log(
          `🔒 Redirecting non-approved user (${userStatus}) to /pending-approval from ${pathname}`
        );
        return NextResponse.redirect(new URL("/pending-approval", req.url));
      }
    }

    // Role-based access control for approved users
    if (userStatus === "APPROVED") {
      // Admin-only routes
      if (pathname.startsWith("/admin")) {
        if (userRole !== "ADMIN") {
          console.log(
            `🚫 Access denied: ${userRole} user trying to access admin route ${pathname}`
          );
          return NextResponse.redirect(new URL("/unauthorized", req.url));
        }
      }

      // Manager and Admin routes
      if (pathname.startsWith("/reports") || pathname.startsWith("/settings")) {
        if (userRole !== "ADMIN" && userRole !== "MANAGER") {
          console.log(
            `🚫 Access denied: ${userRole} user trying to access manager/admin route ${pathname}`
          );
          return NextResponse.redirect(new URL("/unauthorized", req.url));
        }
      }

      // Employee can access dashboard, inventory, and POS
      if (
        pathname.startsWith("/inventory") ||
        pathname.startsWith("/pos") ||
        pathname.startsWith("/dashboard")
      ) {
        // All approved users can access these routes
        // Additional permission checks can be added here if needed
      }
    }

    // Log successful access (only in development)
    if (process.env.NODE_ENV === "development") {
      console.log(
        `✅ Access granted to ${pathname} for ${userRole}/${userStatus} user`
      );
    }

    return NextResponse.next();
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
