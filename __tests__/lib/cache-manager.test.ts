// Mock logger to avoid side effects
jest.mock('@/lib/logger/logger', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// Ensure no Redis in tests (use memory fallback)
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

import { CacheManager, CacheKeys, CacheTags } from '@/lib/cache/cache-manager';

describe('CacheManager (in-memory fallback)', () => {
    beforeEach(async () => {
        await CacheManager.clear();
        CacheManager.resetStats();
    });

    describe('get', () => {
        it('should fetch and cache data on miss', async () => {
            const fetchFn = jest.fn().mockResolvedValue({ id: 1 });
            const result = await CacheManager.get('key1', fetchFn);
            expect(result).toEqual({ id: 1 });
            expect(fetchFn).toHaveBeenCalledTimes(1);
        });

        it('should return cached data on hit', async () => {
            const fetchFn = jest.fn().mockResolvedValue({ id: 1 });
            await CacheManager.get('key1', fetchFn);
            const result = await CacheManager.get('key1', fetchFn);
            expect(result).toEqual({ id: 1 });
            expect(fetchFn).toHaveBeenCalledTimes(1); // Not called again
        });

        it('should refetch after TTL expires', async () => {
            const fetchFn = jest.fn().mockResolvedValue('data');
            const now = Date.now();
            const spy = jest.spyOn(Date, 'now');
            spy.mockReturnValue(now);
            await CacheManager.get('key1', fetchFn, { ttl: 10 }); // 10s TTL
            // Advance time past TTL
            spy.mockReturnValue(now + 11000);
            await CacheManager.get('key1', fetchFn);
            expect(fetchFn).toHaveBeenCalledTimes(2);
            spy.mockRestore();
        });
    });

    describe('set', () => {
        it('should set a value', async () => {
            await CacheManager.set('test', 'value');
            const result = await CacheManager.get('test', async () => 'fallback');
            expect(result).toBe('value');
        });
    });

    describe('invalidate', () => {
        it('should invalidate entries by tag', async () => {
            const fetchFn = jest.fn().mockResolvedValue('data');
            await CacheManager.get('key1', fetchFn, { tags: ['events'] });
            await CacheManager.invalidate('events');
            // Should refetch after invalidation
            await CacheManager.get('key1', fetchFn);
            expect(fetchFn).toHaveBeenCalledTimes(2);
        });
    });

    describe('invalidateKey', () => {
        it('should invalidate a specific key', async () => {
            await CacheManager.set('mykey', 'value');
            await CacheManager.invalidateKey('mykey');
            const fetchFn = jest.fn().mockResolvedValue('new-value');
            const result = await CacheManager.get('mykey', fetchFn);
            expect(result).toBe('new-value');
            expect(fetchFn).toHaveBeenCalledTimes(1);
        });
    });

    describe('invalidateTags', () => {
        it('should invalidate multiple tags', async () => {
            const fn = jest.fn().mockResolvedValue('d');
            await CacheManager.get('a', fn, { tags: ['events'] });
            await CacheManager.get('b', fn, { tags: ['vendors'] });
            await CacheManager.invalidateTags(['events', 'vendors']);
            // Both should refetch
            await CacheManager.get('a', fn);
            await CacheManager.get('b', fn);
            expect(fn).toHaveBeenCalledTimes(4); // 2 initial + 2 after invalidation
        });
    });

    describe('clear', () => {
        it('should remove all entries', async () => {
            await CacheManager.set('a', 1);
            await CacheManager.set('b', 2);
            await CacheManager.clear();
            const fetchFn = jest.fn().mockResolvedValue('fresh');
            await CacheManager.get('a', fetchFn);
            expect(fetchFn).toHaveBeenCalledTimes(1);
        });
    });

    describe('getStats', () => {
        it('should track hits and misses', async () => {
            const fetchFn = jest.fn().mockResolvedValue('data');
            await CacheManager.get('hit', fetchFn);    // miss + cache
            await CacheManager.get('hit', fetchFn);    // hit
            await CacheManager.get('miss', fetchFn);   // miss

            const stats = CacheManager.getStats();
            expect(stats.hits).toBe(1);
            expect(stats.misses).toBe(2);
            expect(stats.backend).toBe('memory');
        });
    });

    describe('warmup', () => {
        it('should pre-populate cache', async () => {
            await CacheManager.warmup([
                { key: 'warm1', fn: async () => 'w1' },
                { key: 'warm2', fn: async () => 'w2' },
            ]);
            const fn1 = jest.fn().mockResolvedValue('fallback');
            const fn2 = jest.fn().mockResolvedValue('fallback');
            const result1 = await CacheManager.get('warm1', fn1);
            const result2 = await CacheManager.get('warm2', fn2);
            expect(result1).toBe('w1');
            expect(result2).toBe('w2');
            expect(fn1).not.toHaveBeenCalled();
            expect(fn2).not.toHaveBeenCalled();
        });
    });
});

describe('CacheKeys', () => {
    it('should generate category key', () => {
        expect(CacheKeys.CATEGORY('cat-1')).toBe('category:cat-1');
    });

    it('should generate event key', () => {
        expect(CacheKeys.EVENT('evt-1')).toBe('event:evt-1');
    });

    it('should have static keys', () => {
        expect(CacheKeys.CATEGORIES_ALL).toBe('categories:all');
        expect(CacheKeys.EVENTS_FEATURED).toBe('events:featured');
    });
});

describe('CacheTags', () => {
    it('should have expected tags', () => {
        expect(CacheTags.CATEGORIES).toBe('categories');
        expect(CacheTags.EVENTS).toBe('events');
        expect(CacheTags.VENDORS).toBe('vendors');
    });
});
