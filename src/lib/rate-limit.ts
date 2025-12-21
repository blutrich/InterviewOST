import { NextResponse } from "next/server";

// Simple in-memory rate limiter (replace with Upstash Redis for production at scale)
// Uses sliding window algorithm

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (fine for single instance, use Redis for multi-instance)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

export interface RateLimitConfig {
  // Maximum requests per window
  limit: number;
  // Window size in seconds
  windowSizeSeconds: number;
}

// Default configs for different endpoint types
export const RATE_LIMIT_CONFIGS = {
  // AI-intensive endpoints (expensive, slow)
  ai: { limit: 10, windowSizeSeconds: 60 }, // 10 requests per minute
  // Chat endpoint (needs to be responsive but protect against abuse)
  chat: { limit: 30, windowSizeSeconds: 60 }, // 30 messages per minute
  // Standard API endpoints
  standard: { limit: 60, windowSizeSeconds: 60 }, // 60 requests per minute
} as const;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP address, user ID, or combination)
 * @param config - Rate limit configuration
 * @returns RateLimitResult with success status and metadata
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSizeSeconds * 1000;
  const key = identifier;

  const entry = rateLimitStore.get(key);

  // No existing entry or window expired - create new entry
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetAt: now + windowMs,
    };
  }

  // Window still active - check if limit exceeded
  if (entry.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get client identifier from request
 * Uses IP address and optionally user ID for authenticated requests
 */
export function getClientIdentifier(
  req: Request,
  userId?: string,
  endpointPrefix?: string
): string {
  // Try to get IP from various headers (works with proxies/load balancers)
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "unknown";

  // Combine endpoint, IP, and user ID for more granular limiting
  const parts = [endpointPrefix || "api", ip];
  if (userId) {
    parts.push(userId);
  }

  return parts.join(":");
}

/**
 * Create a rate limit response with proper headers
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfterSeconds = Math.ceil((result.resetAt - Date.now()) / 1000);

  return NextResponse.json(
    {
      error: "Too many requests. Please try again later.",
      retryAfter: retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.resetAt),
      },
    }
  );
}

/**
 * Add rate limit headers to a successful response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(result.resetAt));
  return response;
}
