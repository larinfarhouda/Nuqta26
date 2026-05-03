/**
 * Rate Limiter
 * Thin wrapper around @upstash/ratelimit for protecting critical endpoints.
 * 
 * When UPSTASH_REDIS_REST_URL is not set, falls back to a no-op limiter
 * so the app works in development without Redis.
 * 
 * @example
 * ```typescript
 * import { checkRateLimit, RateLimiters } from '@/lib/rate-limit/rate-limiter';
 * 
 * const result = await checkRateLimit(userId, RateLimiters.booking);
 * if (!result.allowed) {
 *   return { error: 'Too many requests. Try again later.' };
 * }
 * ```
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger/logger';

// ─── Redis Client ────────────────────────────────────────────────────────────

let redis: Redis | null = null;

function getRedis(): Redis | null {
    if (redis) return redis;

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        logger.warn('Rate limiting disabled: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not configured');
        return null;
    }

    redis = new Redis({ url, token });
    return redis;
}

// ─── Pre-configured Limiters ─────────────────────────────────────────────────

/**
 * Create a rate limiter with the given configuration.
 * Returns null if Redis is not configured (dev mode).
 */
function createLimiter(
    requests: number,
    window: `${number} s` | `${number} m` | `${number} h`,
    prefix: string
): Ratelimit | null {
    const r = getRedis();
    if (!r) return null;

    return new Ratelimit({
        redis: r,
        limiter: Ratelimit.slidingWindow(requests, window),
        prefix: `nuqta:rl:${prefix}`,
        analytics: true,
    });
}

/**
 * Pre-configured rate limiters for different action types
 */
export const RateLimiters = {
    /** Auth actions: login, register, OTP — 5 requests per minute */
    auth: () => createLimiter(5, '1 m', 'auth'),

    /** Booking creation — 10 requests per minute */
    booking: () => createLimiter(10, '1 m', 'booking'),

    /** Review submission — 5 requests per minute */
    review: () => createLimiter(5, '1 m', 'review'),

    /** Payment submission — 5 requests per minute */
    payment: () => createLimiter(5, '1 m', 'payment'),

    /** General API — 30 requests per minute (default) */
    general: () => createLimiter(30, '1 m', 'general'),
} as const;

// ─── Rate Limit Check ────────────────────────────────────────────────────────

export interface RateLimitResult {
    /** Whether the request is allowed */
    allowed: boolean;
    /** Remaining requests in the current window */
    remaining: number;
    /** Unix timestamp (ms) when the rate limit resets */
    reset: number;
}

/**
 * Check rate limit for a given identifier.
 * 
 * @param identifier - Unique identifier (user ID, IP address, etc.)
 * @param limiterFn - Factory function from RateLimiters
 * @returns Rate limit result
 */
export async function checkRateLimit(
    identifier: string,
    limiterFn: () => Ratelimit | null
): Promise<RateLimitResult> {
    const limiter = limiterFn();

    // If no limiter (Redis not configured), allow all requests
    if (!limiter) {
        return { allowed: true, remaining: 999, reset: Date.now() + 60_000 };
    }

    try {
        const result = await limiter.limit(identifier);

        if (!result.success) {
            logger.warn('Rate limit exceeded', {
                identifier,
                remaining: result.remaining,
                reset: new Date(result.reset).toISOString(),
            });
        }

        return {
            allowed: result.success,
            remaining: result.remaining,
            reset: result.reset,
        };
    } catch (error) {
        // If Redis is down, fail open (allow the request)
        logger.error('Rate limit check failed, allowing request', { error, identifier });
        return { allowed: true, remaining: 999, reset: Date.now() + 60_000 };
    }
}
