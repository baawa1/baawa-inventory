import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Public routes that don't require authentication
    const publicRoutes = ["/", "/auth/signin", "/auth/signup", "/auth/error"];

    if (publicRoutes.includes(pathname)) {
      return NextResponse.next();
    }

    // If no token, redirect to sign in
    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    // Role-based route protection
    const userRole = token.role as string;

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

    // All authenticated users can access inventory and POS
    if (pathname.startsWith("/inventory") || pathname.startsWith("/pos")) {
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
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
