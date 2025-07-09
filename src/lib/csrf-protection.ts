/**
 * CSRF Protection Implementation
 * Provides CSRF token generation, validation, and middleware
 */

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth-config";

export interface CSRFToken {
  token: string;
  expires: Date;
}

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) return false;
  return crypto.timingSafeEqual(
    Buffer.from(token, "hex"),
    Buffer.from(storedToken, "hex")
  );
}

/**
 * CSRF middleware for API routes
 */
export function withCSRF(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Skip CSRF for GET requests
    if (req.method === "GET") {
      return handler(req);
    }

    // Get session to access CSRF token
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get CSRF token from headers
    const csrfToken = req.headers.get("x-csrf-token");
    const storedToken = req.cookies.get("csrf-token")?.value;

    if (!csrfToken || !storedToken) {
      return NextResponse.json(
        { error: "CSRF token missing" },
        { status: 403 }
      );
    }

    // Validate CSRF token
    if (!validateCSRFToken(csrfToken, storedToken)) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }

    return handler(req);
  };
}

/**
 * Generate CSRF token for forms
 */
export function generateFormCSRFToken(): CSRFToken {
  const token = generateCSRFToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return { token, expires };
}

/**
 * Set CSRF token in cookies
 */
export function setCSRFTokenCookie(
  response: NextResponse,
  token: string
): void {
  response.cookies.set("csrf-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60, // 24 hours
    path: "/",
  });
}
