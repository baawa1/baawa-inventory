import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

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
    ];

    // Allow public routes
    if (publicRoutes.includes(pathname)) {
      return NextResponse.next();
    }

    // Check user status for authenticated users
    if (token) {
      const userRole = token.role as string;
      const userStatus = token.status as string;

      // Redirect VERIFIED users (pending approval) to pending approval page
      if (userStatus === "VERIFIED" && pathname !== "/pending-approval") {
        return NextResponse.redirect(new URL("/pending-approval", req.url));
      }

      // Only allow APPROVED users to access protected routes
      if (userStatus !== "APPROVED") {
        return NextResponse.redirect(new URL("/pending-approval", req.url));
      }

      // Role-based route protection for approved users
      // Admin-only routes
      if (pathname.startsWith("/admin")) {
        if (userRole !== "ADMIN") {
          return NextResponse.redirect(new URL("/unauthorized", req.url));
        }
      }

      // Manager and Admin routes
      if (pathname.startsWith("/reports") || pathname.startsWith("/settings")) {
        if (userRole !== "ADMIN" && userRole !== "MANAGER") {
          return NextResponse.redirect(new URL("/unauthorized", req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow public routes
        if (
          [
            "/",
            "/login",
            "/logout",
            "/register",
            "/forgot-password",
            "/reset-password",
            "/check-email",
            "/verify-email",
            "/pending-approval",
          ].includes(pathname)
        ) {
          return true;
        }

        // Require authentication for all other routes
        return !!token;
      },
    },
  }
);

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
