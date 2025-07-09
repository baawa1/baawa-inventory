/**
 * Redis Rate Limit Middleware
 * Applies rate limiting to API routes using Redis
 */

import { NextRequest, NextResponse } from "next/server";
import { redisRateLimiter, RateLimitConfig } from "../redis-rate-limiter";
import { ErrorSanitizer } from "../utils/error-sanitizer";

export interface RateLimitMiddlewareOptions {
  config: RateLimitConfig;
  onRateLimitExceeded?: (req: NextRequest, result: any) => NextResponse;
}

/**
 * Create rate limiting middleware
 */
export function withRedisRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: RateLimitMiddlewareOptions
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const result = await redisRateLimiter.checkRateLimit(req, options.config);

      // Set rate limit headers
      const headers = new Headers();
      headers.set("X-RateLimit-Limit", result.limit.toString());
      headers.set("X-RateLimit-Remaining", result.remaining.toString());
      headers.set("X-RateLimit-Reset", result.reset.toISOString());

      if (!result.success) {
        if (result.retryAfter) {
          headers.set("Retry-After", result.retryAfter.toString());
        }

        // Use custom handler if provided
        if (options.onRateLimitExceeded) {
          return options.onRateLimitExceeded(req, result);
        }

        // Default rate limit response
        return NextResponse.json(
          {
            error: options.config.message || "Rate limit exceeded",
            retryAfter: result.retryAfter,
          },
          {
            status: 429,
            headers,
          }
        );
      }

      // Continue to handler
      const response = await handler(req);

      // Add rate limit headers to successful responses
      for (const [key, value] of headers.entries()) {
        response.headers.set(key, value);
      }

      return response;
    } catch (error) {
      ErrorSanitizer.logError(error, "Rate limit middleware error");

      // On error, continue to handler (fail open)
      return handler(req);
    }
  };
}

/**
 * Create rate limiting middleware with specific configuration
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) =>
    withRedisRateLimit(handler, { config });
}

/**
 * Pre-configured rate limit middlewares
 */
export const withAuthRateLimit = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 requests per 15 minutes
  message: "Too many authentication attempts. Please try again later.",
});

export const withApiRateLimit = createRateLimitMiddleware({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  message: "Too many requests. Please slow down.",
});

export const withDataRateLimit = createRateLimitMiddleware({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
  message: "Too many requests. Please slow down.",
});

export const withAdminRateLimit = createRateLimitMiddleware({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 10, // 10 admin actions per 5 minutes
  message: "Too many admin actions. Please wait before trying again.",
});
