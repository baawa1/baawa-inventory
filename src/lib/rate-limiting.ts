/**
 * Rate Limiting Implementation
 * Provides rate limiting for API endpoints with configurable windows and limits
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./db";
import { logger } from "./logger";

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip rate limiting for successful requests
  skipFailedRequests?: boolean; // Skip rate limiting for failed requests
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

// In-memory store for rate limiting (fallback when database is not available)
const memoryStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Generate rate limit key from request
 */
function generateKey(req: NextRequest, config: RateLimitConfig): string {
  if (config.keyGenerator) {
    return config.keyGenerator(req);
  }

  // Default: IP + User Agent + Endpoint
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  const endpoint = req.nextUrl.pathname;

  return `${ip}:${userAgent}:${endpoint}`;
}

/**
 * Get rate limit info from database
 */
async function getRateLimitFromDB(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitInfo | null> {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);

    // Get current rate limit record
    const record = await prisma.rateLimit.findFirst({
      where: {
        key,
        createdAt: {
          gte: windowStart,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!record) {
      return {
        limit: config.maxRequests,
        remaining: config.maxRequests,
        reset: new Date(now.getTime() + config.windowMs),
      };
    }

    const resetTime = new Date(record.createdAt.getTime() + config.windowMs);
    const remaining = Math.max(0, config.maxRequests - record.count);

    return {
      limit: config.maxRequests,
      remaining,
      reset: resetTime,
      retryAfter:
        remaining === 0
          ? Math.ceil((resetTime.getTime() - now.getTime()) / 1000)
          : undefined,
    };
  } catch (error) {
    logger.error("Failed to get rate limit from database", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

/**
 * Update rate limit in database
 */
async function updateRateLimitInDB(key: string): Promise<void> {
  try {
    await prisma.rateLimit.create({
      data: {
        key,
        count: 1,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    logger.error("Failed to update rate limit in database", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get rate limit info from memory store
 */
function getRateLimitFromMemory(
  key: string,
  config: RateLimitConfig
): RateLimitInfo {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    const resetTime = now + config.windowMs;
    memoryStore.set(key, { count: 1, resetTime });

    return {
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: new Date(resetTime),
    };
  }

  const remaining = Math.max(0, config.maxRequests - record.count);
  record.count++;

  return {
    limit: config.maxRequests,
    remaining,
    reset: new Date(record.resetTime),
    retryAfter:
      remaining === 0 ? Math.ceil((record.resetTime - now) / 1000) : undefined,
  };
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(config: RateLimitConfig) {
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (req: NextRequest): Promise<NextResponse> => {
      const key = generateKey(req, config);

      // Try database first, fallback to memory
      let rateLimitInfo = await getRateLimitFromDB(key, config);

      if (!rateLimitInfo) {
        rateLimitInfo = getRateLimitFromMemory(key, config);
      }

      // Check if rate limit exceeded
      if (rateLimitInfo.remaining <= 0) {
        const response = NextResponse.json(
          {
            error: "Too many requests",
            retryAfter: rateLimitInfo.retryAfter,
          },
          { status: 429 }
        );

        // Add rate limit headers
        response.headers.set(
          "X-RateLimit-Limit",
          rateLimitInfo.limit.toString()
        );
        response.headers.set(
          "X-RateLimit-Remaining",
          rateLimitInfo.remaining.toString()
        );
        response.headers.set(
          "X-RateLimit-Reset",
          rateLimitInfo.reset.toISOString()
        );

        if (rateLimitInfo.retryAfter) {
          response.headers.set(
            "Retry-After",
            rateLimitInfo.retryAfter.toString()
          );
        }

        logger.warn("Rate limit exceeded", {
          key,
          limit: rateLimitInfo.limit,
          reset: rateLimitInfo.reset,
        });

        return response;
      }

      // Update rate limit (async, don't wait)
      updateRateLimitInDB(key).catch(() => {
        // Fallback to memory update if database fails
        const now = Date.now();
        const record = memoryStore.get(key);

        if (record && now <= record.resetTime) {
          record.count++;
        } else {
          memoryStore.set(key, { count: 1, resetTime: now + config.windowMs });
        }
      });

      // Call the original handler
      const response = await handler(req);

      // Add rate limit headers to response
      response.headers.set("X-RateLimit-Limit", rateLimitInfo.limit.toString());
      response.headers.set(
        "X-RateLimit-Remaining",
        (rateLimitInfo.remaining - 1).toString()
      );
      response.headers.set(
        "X-RateLimit-Reset",
        rateLimitInfo.reset.toISOString()
      );

      return response;
    };
  };
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  // Strict rate limiting for auth endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per 15 minutes
  },

  // Moderate rate limiting for general API
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per 15 minutes
  },

  // Loose rate limiting for public endpoints
  PUBLIC: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000, // 1000 requests per 15 minutes
  },
} as const;
