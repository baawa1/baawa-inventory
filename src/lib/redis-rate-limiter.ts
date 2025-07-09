/**
 * Redis-based Rate Limiter
 * Persistent rate limiting that survives server restarts
 */

import { Redis } from "ioredis";
import { NextRequest } from "next/server";
import { logger } from "./logger";
import { ErrorSanitizer } from "./utils/error-sanitizer";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export class RedisRateLimiter {
  private redis: Redis | null = null;
  private fallbackStore: Map<string, { count: number; resetTime: number }> =
    new Map();
  private isRedisAvailable = false;

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) {
        logger.warn(
          "Redis URL not configured, falling back to in-memory rate limiting"
        );
        return;
      }

      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      this.redis.on("connect", () => {
        this.isRedisAvailable = true;
        logger.info("Redis connected for rate limiting");
      });

      this.redis.on("error", (error: any) => {
        this.isRedisAvailable = false;
        ErrorSanitizer.logError(error, "Redis rate limiter error");
      });

      this.redis.on("close", () => {
        this.isRedisAvailable = false;
        logger.warn(
          "Redis connection closed, falling back to in-memory rate limiting"
        );
      });

      await this.redis.connect();
    } catch (error) {
      this.isRedisAvailable = false;
      ErrorSanitizer.logError(error, "Failed to initialize Redis rate limiter");
    }
  }

  /**
   * Generate rate limit key
   */
  private generateKey(req: NextRequest, config: RateLimitConfig): string {
    if (config.keyGenerator) {
      return config.keyGenerator(req);
    }

    // Default key generation based on IP
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0]
      : req.headers.get("x-real-ip") || "unknown";
    const pathname = req.nextUrl.pathname;

    return `rate_limit:${ip}:${pathname}`;
  }

  /**
   * Check and update rate limit using Redis
   */
  private async checkRateLimitRedis(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    if (!this.redis || !this.isRedisAvailable) {
      return this.checkRateLimitMemory(key, config);
    }

    try {
      const now = Date.now();
      const windowStart = now - config.windowMs;
      const redisKey = `rl:${key}`;

      // Use Redis sorted set to track requests in time window
      const pipeline = this.redis.pipeline();

      // Remove expired entries
      pipeline.zremrangebyscore(redisKey, 0, windowStart);

      // Count current requests in window
      pipeline.zcard(redisKey);

      // Add current request
      pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);

      // Set expiration
      pipeline.expire(redisKey, Math.ceil(config.windowMs / 1000));

      const results = await pipeline.exec();

      if (!results) {
        return this.checkRateLimitMemory(key, config);
      }

      const currentCount = (results[1][1] as number) || 0;
      const remaining = Math.max(0, config.maxRequests - currentCount - 1);
      const reset = new Date(now + config.windowMs);

      return {
        success: currentCount < config.maxRequests,
        limit: config.maxRequests,
        remaining,
        reset,
        retryAfter:
          remaining <= 0 ? Math.ceil(config.windowMs / 1000) : undefined,
      };
    } catch (error) {
      ErrorSanitizer.logError(error, "Redis rate limit check failed");
      return this.checkRateLimitMemory(key, config);
    }
  }

  /**
   * Fallback in-memory rate limiting
   */
  private checkRateLimitMemory(
    key: string,
    config: RateLimitConfig
  ): RateLimitResult {
    const now = Date.now();
    const current = this.fallbackStore.get(key);

    if (!current || current.resetTime < now) {
      // First request or window expired
      this.fallbackStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });

      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        reset: new Date(now + config.windowMs),
      };
    }

    if (current.count >= config.maxRequests) {
      // Rate limit exceeded
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: new Date(current.resetTime),
        retryAfter: Math.ceil((current.resetTime - now) / 1000),
      };
    }

    // Increment counter
    current.count++;

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - current.count,
      reset: new Date(current.resetTime),
    };
  }

  /**
   * Check rate limit for a request
   */
  async checkRateLimit(
    req: NextRequest,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = this.generateKey(req, config);
    return this.checkRateLimitRedis(key, config);
  }

  /**
   * Reset rate limit for a key
   */
  async resetRateLimit(key: string): Promise<void> {
    try {
      if (this.redis && this.isRedisAvailable) {
        await this.redis.del(`rl:${key}`);
      }
      this.fallbackStore.delete(key);
    } catch (error) {
      ErrorSanitizer.logError(error, "Failed to reset rate limit");
    }
  }

  /**
   * Get current rate limit status
   */
  async getRateLimitStatus(
    req: NextRequest,
    config: RateLimitConfig
  ): Promise<{ count: number; resetTime: number }> {
    const key = this.generateKey(req, config);

    try {
      if (this.redis && this.isRedisAvailable) {
        const now = Date.now();
        const windowStart = now - config.windowMs;
        const redisKey = `rl:${key}`;

        const count = await this.redis.zcount(redisKey, windowStart, now);
        const resetTime = now + config.windowMs;

        return { count, resetTime };
      }
    } catch (error) {
      ErrorSanitizer.logError(error, "Failed to get Redis rate limit status");
    }

    // Fallback to memory
    const current = this.fallbackStore.get(key);
    return {
      count: current?.count || 0,
      resetTime: current?.resetTime || Date.now() + config.windowMs,
    };
  }

  /**
   * Cleanup expired entries (for in-memory fallback)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.fallbackStore.entries()) {
      if (value.resetTime < now) {
        this.fallbackStore.delete(key);
      }
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.isRedisAvailable = false;
    }
  }
}

// Singleton instance
export const redisRateLimiter = new RedisRateLimiter();

// Predefined rate limit configurations
export const REDIS_RATE_LIMITS = {
  // Strict rate limiting for auth endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per 15 minutes
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

// Cleanup interval for in-memory fallback
setInterval(() => {
  redisRateLimiter.cleanup();
}, 60000); // Clean up every minute
