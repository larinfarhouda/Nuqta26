/**
 * Cache Manager
 * In-memory caching with TTL and tag-based invalidation
 */

import { logger } from '../logger/logger';

/**
 * Cache entry structure
 */
interface CacheEntry<T> {
    data: T;
    expires: number;
    tags: string[];
    createdAt: number;
}

/**
 * Cache options
 */
export interface CacheOptions {
    /** Time to live in seconds (default:  300 = 5 minutes) */
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
}

/**
 * In-Memory Cache Manager
 * Provides caching with TTL and tag-based invalidation
 * 
 * @example
 * ```typescript
 * // Cache with default TTL (5 minutes)
 * const categories = await CacheManager.get(
 *   'categories:all',
 *   () => categoryRepo.findAll()
 * );
 * 
 * // Cache with custom TTL and tags
 * const event = await CacheManager.get(
 *   `event:${slug}`,
 *   () => eventRepo.findBySlug(slug),
 *   { ttl: 600, tags: ['events', `event:${slug}`] }
 * );
 * 
 * // Invalidate by tag
 * CacheManager.invalidate('events');
 * ```
 */
export class CacheManager {
    private static cache = new Map<string, CacheEntry<any>>();
    private static stats = {
        hits: 0,
        misses: 0,
    };

    /**
     * Default TTL in seconds
     */
    private static DEFAULT_TTL = 300; // 5 minutes

    /**
     * Maximum cache size (number of entries)
     */
    private static MAX_SIZE = 1000;

    /**
     * Get value from cache or fetch and cache it
     * 
     * @param key - Cache key
     * @param fetchFn - Function to fetch data if not in cache
     * @param options - Cache options (TTL, tags)
     * @returns Cached or fetched data
     */
    static async get<T>(
        key: string,
        fetchFn: () => Promise<T>,
        options: CacheOptions = {}
    ): Promise<T> {
        // Check cache
        const cached = this.cache.get(key);

        if (cached && cached.expires > Date.now()) {
            this.stats.hits++;
            logger.debug('Cache hit', {
                key,
                age: `${((Date.now() - cached.createdAt) / 1000).toFixed(1)}s`
            });
            return cached.data as T;
        }

        // Cache miss - fetch data
        this.stats.misses++;
        logger.debug('Cache miss', { key });

        try {
            const data = await fetchFn();
            this.set(key, data, options);
            return data;
        } catch (error) {
            logger.error('Cache fetch failed', { key, error });
            throw error;
        }
    }

    /**
     * Set a value in the cache
     * 
     * @param key - Cache key
     * @param data - Data to cache
     * @param options - Cache options
     */
    static set<T>(key: string, data: T, options: CacheOptions = {}) {
        // Enforce max size
        if (this.cache.size >= this.MAX_SIZE) {
            this.evictOldest();
        }

        const ttl = options.ttl || this.DEFAULT_TTL;
        const entry: CacheEntry<T> = {
            data,
            expires: Date.now() + (ttl * 1000),
            tags: options.tags || [],
            createdAt: Date.now(),
        };

        this.cache.set(key, entry);

        logger.debug('Cache set', {
            key,
            ttl: `${ttl}s`,
            tags: entry.tags,
        });
    }

    /**
     * Get a value from cache if it exists and is not expired
     * 
     * @param key - Cache key
     * @returns Cached value or null
     */
    static getCached<T>(key: string): T | null {
        const cached = this.cache.get(key);

        if (cached && cached.expires > Date.now()) {
            this.stats.hits++;
            return cached.data as T;
        }

        if (cached) {
            // Expired - remove it
            this.cache.delete(key);
        }

        this.stats.misses++;
        return null;
    }

    /**
     * Invalidate cache entries by tag
     * 
     * @param tag - Tag to invalidate
     */
    static invalidate(tag: string) {
        let count = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.tags.includes(tag)) {
                this.cache.delete(key);
                count++;
            }
        }

        logger.info('Cache invalidated by tag', { tag, count });
    }

    /**
     * Invalidate specific cache key
     * 
     * @param key - Cache key to invalidate
     */
    static invalidateKey(key: string) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            logger.debug('Cache key invalidated', { key });
        }
    }

    /**
     * Invalidate multiple tags at once
     * 
     * @param tags - Array of tags to invalidate
     */
    static invalidateTags(tags: string[]) {
        tags.forEach(tag => this.invalidate(tag));
    }

    /**
     * Clear all cache entries
     */
    static clear() {
        const size = this.cache.size;
        this.cache.clear();
        logger.info('Cache cleared', { entriesRemoved: size });
    }

    /**
     * Remove expired entries
     */
    static cleanup() {
        const now = Date.now();
        let count = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.expires < now) {
                this.cache.delete(key);
                count++;
            }
        }

        if (count > 0) {
            logger.info('Cache cleanup completed', { entriesRemoved: count });
        }
    }

    /**
     * Evict oldest entry to enforce max size
     */
    private static evictOldest() {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.createdAt < oldestTime) {
                oldestTime = entry.createdAt;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
            logger.debug('Cache entry evicted (max size reached)', { key: oldestKey });
        }
    }

    /**
     * Get cache statistics
     * 
     * @returns Cache statistics including hits, misses, and hit rate
     */
    static getStats(): CacheStats {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            size: this.cache.size,
            hitRate: Math.round(hitRate * 100) / 100,
        };
    }

    /**
     * Log cache statistics
     */
    static logStats() {
        const stats = this.getStats();

        logger.info('Cache Statistics', {
            hits: stats.hits,
            misses: stats.misses,
            hitRate: `${stats.hitRate}%`,
            size: stats.size,
            maxSize: this.MAX_SIZE,
        });
    }

    /**
     * Reset cache statistics
     */
    static resetStats() {
        this.stats.hits = 0;
        this.stats.misses = 0;
        logger.info('Cache statistics reset');
    }

    /**
     * Warm cache with common queries
     * Call this on application startup
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
        logger.info('Cache warmup completed', { size: this.cache.size });
    }
}

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

    EVENT: (eventId: string) => `event:${eventId}`,
    VENDOR: (vendorId: string) => `vendor:${vendorId}`,
    USER: (userId: string) => `user:${userId}`,
} as const;

// Set up periodic cleanup (every 5 minutes)
if (typeof setInterval !== 'undefined') {
    setInterval(() => CacheManager.cleanup(), 5 * 60 * 1000);
}
