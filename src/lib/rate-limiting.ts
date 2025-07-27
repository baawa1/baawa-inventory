/**
 * Rate Limiting Utility
 * Provides rate limiting for API endpoints to prevent abuse
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip rate limiting for successful requests
  skipFailedRequests?: boolean; // Skip rate limiting for failed requests
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (in production, use Redis or similar)
const rateLimitStore: RateLimitStore = {};

// Default configurations
export const RATE_LIMIT_CONFIGS = {
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
  PUBLIC: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
  },
  UPLOAD: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 50,
  },
} as const;

/**
 * Generate rate limit key for a request
 */
function generateKey(request: NextRequest, config: RateLimitConfig): string {
  if (config.keyGenerator) {
    return config.keyGenerator(request);
  }

  // Default: IP + User Agent
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `${ip}:${userAgent}`;
}

/**
 * Check if request is within rate limits
 */
function checkRateLimit(
  key: string,
  config: RateLimitConfig
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();

  // Clean up expired entries
  if (rateLimitStore[key] && rateLimitStore[key].resetTime < now) {
    delete rateLimitStore[key];
  }

  // Initialize or get current state
  if (!rateLimitStore[key]) {
    rateLimitStore[key] = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }

  const current = rateLimitStore[key];

  // Check if within window
  if (current.resetTime < now) {
    // Reset window
    current.count = 0;
    current.resetTime = now + config.windowMs;
  }

  // Check if limit exceeded
  if (current.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
    };
  }

  // Increment count
  current.count++;

  return {
    allowed: true,
    remaining: config.maxRequests - current.count,
    resetTime: current.resetTime,
  };
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.API
) {
  return function <T extends any[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async function (
      request: NextRequest,
      ...args: T
    ): Promise<NextResponse> {
      const key = generateKey(request, config);
      const rateLimit = checkRateLimit(key, config);

      // Set rate limit headers
      const headers = {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
      };

      if (!rateLimit.allowed) {
        logger.security('Rate limit exceeded', {
          key,
          limit: config.maxRequests,
          windowMs: config.windowMs,
          userAgent: request.headers.get('user-agent'),
          ip:
            request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip'),
        });

        return NextResponse.json(
          {
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
          },
          {
            status: 429,
            headers,
          }
        );
      }

      // Call the original handler
      const response = await handler(request, ...args);

      // Add rate limit headers to response
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    };
  };
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}

// Clean up expired entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
