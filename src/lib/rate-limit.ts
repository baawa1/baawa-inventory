import { NextRequest, NextResponse } from "next/server";

// In-memory store for rate limiting (use Redis in production)
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Rate limit configuration
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  keyGenerator?: (req: NextRequest) => string; // Custom key generator
}

// Default configurations for different endpoints
export const RATE_LIMIT_CONFIGS = {
  // Strict limits for auth endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: "Too many authentication attempts. Please try again later.",
  },
  // Medium limits for API endpoints
  API: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    message: "Too many requests. Please slow down.",
  },
  // Looser limits for data fetching
  DATA: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    message: "Too many requests. Please slow down.",
  },
  // Very strict for admin actions
  ADMIN: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10, // 10 admin actions per 5 minutes
    message: "Too many admin actions. Please wait before trying again.",
  },
} as const;

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60 * 1000); // Clean up every minute

// Generate key from request
function generateKey(
  req: NextRequest,
  keyGenerator?: (req: NextRequest) => string
): string {
  if (keyGenerator) {
    return keyGenerator(req);
  }

  // Use IP address as default key
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]
    : req.headers.get("x-real-ip") || "unknown";
  const pathname = req.nextUrl.pathname;

  return `${ip}:${pathname}`;
}

// Rate limiting middleware
export function withRateLimit(config: RateLimitConfig) {
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (req: NextRequest): Promise<NextResponse> => {
      const now = Date.now();
      const key = generateKey(req, config.keyGenerator);

      // Get current count for this key
      const current = store[key];

      if (!current || current.resetTime < now) {
        // First request or window expired, reset counter
        store[key] = {
          count: 1,
          resetTime: now + config.windowMs,
        };

        // Add rate limit headers
        const response = await handler(req);
        response.headers.set(
          "X-RateLimit-Limit",
          config.maxRequests.toString()
        );
        response.headers.set(
          "X-RateLimit-Remaining",
          (config.maxRequests - 1).toString()
        );
        response.headers.set(
          "X-RateLimit-Reset",
          new Date(store[key].resetTime).toISOString()
        );

        return response;
      }

      if (current.count >= config.maxRequests) {
        // Rate limit exceeded
        return NextResponse.json(
          {
            error: config.message || "Rate limit exceeded",
            code: "RATE_LIMIT_EXCEEDED",
            retryAfter: Math.ceil((current.resetTime - now) / 1000),
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": config.maxRequests.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": new Date(current.resetTime).toISOString(),
              "Retry-After": Math.ceil(
                (current.resetTime - now) / 1000
              ).toString(),
            },
          }
        );
      }

      // Increment counter
      current.count++;

      // Continue with request
      const response = await handler(req);

      // Add rate limit headers
      response.headers.set("X-RateLimit-Limit", config.maxRequests.toString());
      response.headers.set(
        "X-RateLimit-Remaining",
        (config.maxRequests - current.count).toString()
      );
      response.headers.set(
        "X-RateLimit-Reset",
        new Date(current.resetTime).toISOString()
      );

      return response;
    };
  };
}

// Pre-configured middleware functions
export const withAuthRateLimit = withRateLimit(RATE_LIMIT_CONFIGS.AUTH);
export const withApiRateLimit = withRateLimit(RATE_LIMIT_CONFIGS.API);
export const withDataRateLimit = withRateLimit(RATE_LIMIT_CONFIGS.DATA);
export const withAdminRateLimit = withRateLimit(RATE_LIMIT_CONFIGS.ADMIN);

// Combined middleware for authenticated endpoints
export function withAuthAndRateLimit(
  rateLimitConfig: RateLimitConfig = RATE_LIMIT_CONFIGS.API,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withRateLimit(rateLimitConfig)(handler);
}

// User-specific rate limiting (requires authentication)
export function withUserRateLimit(config: RateLimitConfig) {
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    const rateLimitedHandler = withRateLimit({
      ...config,
      keyGenerator: (req: NextRequest) => {
        // Try to get user ID from Authorization header or session
        const authHeader = req.headers.get("authorization");
        if (authHeader) {
          // Extract user ID from token if available
          // This is a simplified approach - in production, you'd decode the JWT
          const token = authHeader.replace("Bearer ", "");
          return `user:${token.slice(-10)}:${req.nextUrl.pathname}`;
        }

        // Fallback to IP-based limiting
        const forwarded = req.headers.get("x-forwarded-for");
        const ip = forwarded
          ? forwarded.split(",")[0]
          : req.headers.get("x-real-ip") || "unknown";
        return `ip:${ip}:${req.nextUrl.pathname}`;
      },
    })(handler);

    return rateLimitedHandler;
  };
}
