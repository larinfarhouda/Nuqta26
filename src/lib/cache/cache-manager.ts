/**
 * Cache Manager
 * Distributed caching with Upstash Redis, with in-memory fallback.
 * 
 * When UPSTASH_REDIS_REST_URL is configured, uses Redis for shared,
 * persistent caching across all Vercel serverless instances.
 * Falls back to in-memory Map when Redis is not available (dev mode).
 */

import { Redis } from '@upstash/redis';
import { logger } from '../logger/logger';

// ─── Redis Client ────────────────────────────────────────────────────────────

let redis: Redis | null = null;
let redisAvailable: boolean | null = null;

function getRedis(): Redis | null {
    if (redisAvailable === false) return null;
    if (redis) return redis;

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        redisAvailable = false;
        logger.info('CacheManager: Using in-memory fallback (UPSTASH_REDIS not configured)');
        return null;
    }

    redis = new Redis({ url, token });
    redisAvailable = true;
    return redis;
}

// ─── In-Memory Fallback ──────────────────────────────────────────────────────

interface MemoryCacheEntry {
    data: string; // JSON-serialized
    expires: number;
    tags: string[];
}

const memoryCache = new Map<string, MemoryCacheEntry>();
const MAX_MEMORY_SIZE = 1000;

// ─── Cache Options ───────────────────────────────────────────────────────────

/**
 * Cache options
 */
export interface CacheOptions {
    /** Time to live in seconds (default: 300 = 5 minutes) */
    ttl?: number;
    /** Tags for cache invalidation */
    tags?: string[];
}

/**
 * Cache statistics
 */
interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
    backend: 'redis' | 'memory';
}

// ─── Cache Manager ───────────────────────────────────────────────────────────

/**
 * Distributed Cache Manager
 * Uses Upstash Redis when available, falls back to in-memory Map.
 * The public API is identical regardless of backend.
 *
 * @example
 * ```typescript
 * const categories = await CacheManager.get(
 *   'categories:all',
 *   () => categoryRepo.findAll(),
 *   { ttl: 600, tags: ['categories'] }
 * );
 *
 * CacheManager.invalidate('categories');
 * ```
 */
export class CacheManager {
    private static stats = { hits: 0, misses: 0 };
    private static DEFAULT_TTL = 300; // 5 minutes
    private static CACHE_PREFIX = 'nuqta:cache:';
    private static TAG_PREFIX = 'nuqta:tag:';

    /**
     * Get value from cache or fetch and cache it
     */
    static async get<T>(
        key: string,
        fetchFn: () => Promise<T>,
        options: CacheOptions = {}
    ): Promise<T> {
        const r = getRedis();
        const prefixedKey = `${this.CACHE_PREFIX}${key}`;

        // ── Redis Path ──
        if (r) {
            try {
                const cached = await r.get<string>(prefixedKey);
                if (cached !== null) {
                    this.stats.hits++;
                    logger.debug('Cache hit (Redis)', { key });
                    return JSON.parse(cached as string) as T;
                }
            } catch (error) {
                logger.error('Redis get failed, fetching fresh', { key, error });
            }

            // Miss — fetch and store
            this.stats.misses++;
            logger.debug('Cache miss (Redis)', { key });

            const data = await fetchFn();
            const ttl = options.ttl || this.DEFAULT_TTL;

            try {
                await r.set(prefixedKey, JSON.stringify(data), { ex: ttl });

                // Store key-to-tag mappings for invalidation
                if (options.tags && options.tags.length > 0) {
                    const pipeline = r.pipeline();
                    for (const tag of options.tags) {
                        pipeline.sadd(`${this.TAG_PREFIX}${tag}`, prefixedKey);
                    }
                    await pipeline.exec();
                }
            } catch (error) {
                logger.error('Redis set failed', { key, error });
            }

            return data;
        }

        // ── In-Memory Path ──
        const memEntry = memoryCache.get(key);
        if (memEntry && memEntry.expires > Date.now()) {
            this.stats.hits++;
            logger.debug('Cache hit (memory)', { key });
            return JSON.parse(memEntry.data) as T;
        }

        this.stats.misses++;
        logger.debug('Cache miss (memory)', { key });

        const data = await fetchFn();
        const ttl = options.ttl || this.DEFAULT_TTL;

        // Enforce max size
        if (memoryCache.size >= MAX_MEMORY_SIZE) {
            const oldestKey = memoryCache.keys().next().value;
            if (oldestKey) memoryCache.delete(oldestKey);
        }

        memoryCache.set(key, {
            data: JSON.stringify(data),
            expires: Date.now() + ttl * 1000,
            tags: options.tags || [],
        });

        return data;
    }

    /**
     * Set a value in the cache directly
     */
    static async set<T>(key: string, data: T, options: CacheOptions = {}) {
        const r = getRedis();
        const ttl = options.ttl || this.DEFAULT_TTL;

        if (r) {
            const prefixedKey = `${this.CACHE_PREFIX}${key}`;
            try {
                await r.set(prefixedKey, JSON.stringify(data), { ex: ttl });
                if (options.tags && options.tags.length > 0) {
                    const pipeline = r.pipeline();
                    for (const tag of options.tags) {
                        pipeline.sadd(`${this.TAG_PREFIX}${tag}`, prefixedKey);
                    }
                    await pipeline.exec();
                }
            } catch (error) {
                logger.error('Redis set failed', { key, error });
            }
        } else {
            if (memoryCache.size >= MAX_MEMORY_SIZE) {
                const oldestKey = memoryCache.keys().next().value;
                if (oldestKey) memoryCache.delete(oldestKey);
            }
            memoryCache.set(key, {
                data: JSON.stringify(data),
                expires: Date.now() + ttl * 1000,
                tags: options.tags || [],
            });
        }
    }

    /**
     * Invalidate cache entries by tag
     */
    static async invalidate(tag: string) {
        const r = getRedis();

        if (r) {
            try {
                const tagKey = `${this.TAG_PREFIX}${tag}`;
                const keys = await r.smembers(tagKey);

                if (keys.length > 0) {
                    const pipeline = r.pipeline();
                    for (const key of keys) {
                        pipeline.del(key as string);
                    }
                    pipeline.del(tagKey);
                    await pipeline.exec();
                    logger.info('Cache invalidated by tag (Redis)', { tag, count: keys.length });
                }
            } catch (error) {
                logger.error('Redis invalidation failed', { tag, error });
            }
        } else {
            let count = 0;
            for (const [key, entry] of memoryCache.entries()) {
                if (entry.tags.includes(tag)) {
                    memoryCache.delete(key);
                    count++;
                }
            }
            if (count > 0) {
                logger.info('Cache invalidated by tag (memory)', { tag, count });
            }
        }
    }

    /**
     * Invalidate a specific cache key
     */
    static async invalidateKey(key: string) {
        const r = getRedis();

        if (r) {
            try {
                await r.del(`${this.CACHE_PREFIX}${key}`);
            } catch (error) {
                logger.error('Redis key invalidation failed', { key, error });
            }
        } else {
            memoryCache.delete(key);
        }
    }

    /**
     * Invalidate multiple tags at once
     */
    static async invalidateTags(tags: string[]) {
        await Promise.all(tags.map(tag => this.invalidate(tag)));
    }

    /**
     * Clear all cache entries
     */
    static async clear() {
        const r = getRedis();

        if (r) {
            try {
                // Scan and delete all nuqta:cache:* keys
                let cursor = 0;
                do {
                    const [nextCursor, keys] = await r.scan(cursor, {
                        match: `${this.CACHE_PREFIX}*`,
                        count: 100,
                    });
                    cursor = Number(nextCursor);
                    if (keys.length > 0) {
                        const pipeline = r.pipeline();
                        for (const key of keys) {
                            pipeline.del(key as string);
                        }
                        await pipeline.exec();
                    }
                } while (cursor !== 0);

                logger.info('Cache cleared (Redis)');
            } catch (error) {
                logger.error('Redis clear failed', { error });
            }
        } else {
            const size = memoryCache.size;
            memoryCache.clear();
            logger.info('Cache cleared (memory)', { entriesRemoved: size });
        }
    }

    /**
     * Get cache statistics
     */
    static getStats(): CacheStats {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            size: memoryCache.size, // memory size only (Redis size would require DBSIZE call)
            hitRate: Math.round(hitRate * 100) / 100,
            backend: getRedis() ? 'redis' : 'memory',
        };
    }

    /**
     * Log cache statistics
     */
    static logStats() {
        const stats = this.getStats();
        logger.info('Cache Statistics', {
            ...stats,
            maxSize: MAX_MEMORY_SIZE,
        });
    }

    /**
     * Reset cache statistics
     */
    static resetStats() {
        this.stats.hits = 0;
        this.stats.misses = 0;
    }

    /**
     * Warm cache with common queries
     */
    static async warmup(warmupFns: Array<{ key: string; fn: () => Promise<any>; options?: CacheOptions }>) {
        logger.info('Starting cache warmup', { count: warmupFns.length });

        const promises = warmupFns.map(async ({ key, fn, options }) => {
            try {
                await this.get(key, fn, options);
            } catch (error) {
                logger.warn('Cache warmup failed for key', { key, error });
            }
        });

        await Promise.all(promises);
        logger.info('Cache warmup completed');
    }
}

// ─── Cache Keys & Tags ───────────────────────────────────────────────────────

/**
 * Common cache keys - centralized for consistency
 */
export const CacheKeys = {
    // Categories
    CATEGORIES_ALL: 'categories:all',
    CATEGORY: (id: string) => `category:${id}`,

    // Events
    EVENT: (slugOrId: string) => `event:${slugOrId}`,
    EVENTS_FEATURED: 'events:featured',
    EVENTS_PUBLIC: (filters: string) => `events:public:${filters}`,

    // Vendors
    VENDOR: (slugOrId: string) => `vendor:${slugOrId}`,
    VENDOR_EVENTS: (vendorId: string) => `vendor:${vendorId}:events`,

    // Reviews
    EVENT_REVIEWS: (eventId: string) => `reviews:event:${eventId}`,
    EVENT_RATING: (eventId: string) => `rating:event:${eventId}`,

    // User
    USER_FAVORITES: (userId: string) => `user:${userId}:favorites`,

    // Countries
    COUNTRIES_ALL: 'countries:all',
    SUBSCRIPTION_TIERS: 'subscription:tiers',
} as const;

/**
 * Common cache tags - for invalidation
 */
export const CacheTags = {
    CATEGORIES: 'categories',
    EVENTS: 'events',
    VENDORS: 'vendors',
    REVIEWS: 'reviews',
    USERS: 'users',
    COUNTRIES: 'countries',

    EVENT: (eventId: string) => `event:${eventId}`,
    VENDOR: (vendorId: string) => `vendor:${vendorId}`,
    USER: (userId: string) => `user:${userId}`,
} as const;
