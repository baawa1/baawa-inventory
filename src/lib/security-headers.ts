/**
 * Security Headers Configuration
 * Implements comprehensive security headers for the application
 */

export interface SecurityHeaders {
  [key: string]: string;
}

/**
 * Generate security headers for responses
 */
export function generateSecurityHeaders(): SecurityHeaders {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    // Content Security Policy
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
      "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.resend.com https://supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),

    // HTTP Strict Transport Security
    "Strict-Transport-Security": isProduction
      ? "max-age=31536000; includeSubDomains; preload"
      : "max-age=0",

    // Prevent clickjacking
    "X-Frame-Options": "DENY",

    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",

    // XSS Protection
    "X-XSS-Protection": "1; mode=block",

    // Referrer Policy
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Permissions Policy
    "Permissions-Policy": [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
    ].join(", "),

    // Cache Control for sensitive pages
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

/**
 * Generate security headers for API responses
 */
export function generateAPIHeaders(): SecurityHeaders {
  return {
    ...generateSecurityHeaders(),
    "Content-Type": "application/json",
    "X-API-Version": "1.0",
  };
}

/**
 * Generate security headers for static assets
 */
export function generateStaticHeaders(): SecurityHeaders {
  return {
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };
}

/**
 * Apply security headers to Next.js response
 */
export function applySecurityHeaders(response: Response): Response {
  const headers = generateSecurityHeaders();

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
