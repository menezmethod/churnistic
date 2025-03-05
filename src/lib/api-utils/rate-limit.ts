import { NextResponse } from 'next/server';

import { APIError } from './error';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const defaultConfig: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
};

// In-memory store for rate limiting
// In production, you might want to use Redis or another distributed store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Cleans up expired rate limit entries
 */
function cleanupStore() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime <= now) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up expired entries every minute
setInterval(cleanupStore, 60 * 1000);

/**
 * Gets rate limit key from request
 * @param req Request object
 * @returns Rate limit key
 */
function getRateLimitKey(req: Request): string {
  // Use IP address as key
  // In production, you might want to use X-Forwarded-For or similar
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return `${ip}:${req.method}:${new URL(req.url).pathname}`;
}

/**
 * Checks if a request should be rate limited
 * @param req Request object
 * @param config Rate limit configuration
 * @returns NextResponse if rate limited, undefined otherwise
 */
export function checkRateLimit(
  req: Request,
  config: Partial<RateLimitConfig> = {}
): NextResponse | undefined {
  const { maxRequests, windowMs } = { ...defaultConfig, ...config };
  const key = getRateLimitKey(req);
  const now = Date.now();

  let limitData = rateLimitStore.get(key);

  // Reset if window has expired
  if (!limitData || limitData.resetTime <= now) {
    limitData = {
      count: 0,
      resetTime: now + windowMs,
    };
  }

  // Increment request count
  limitData.count++;
  rateLimitStore.set(key, limitData);

  // Calculate remaining requests and time
  const remaining = Math.max(0, maxRequests - limitData.count);
  const reset = Math.ceil((limitData.resetTime - now) / 1000);

  // Return error response if limit exceeded
  if (remaining === 0) {
    throw new APIError('Too many requests', 'rate_limit_exceeded', 429, { reset });
  }

  return undefined;
}

/**
 * Rate limiting middleware for API routes
 * @param config Rate limit configuration
 * @returns Middleware function
 */
export function withRateLimit(config: Partial<RateLimitConfig> = {}) {
  return function (handler: (req: Request, ...args: unknown[]) => Promise<Response>) {
    return async function (req: Request, ...args: unknown[]): Promise<Response> {
      const rateLimitResponse = checkRateLimit(req, config);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }
      return handler(req, ...args);
    };
  };
}
