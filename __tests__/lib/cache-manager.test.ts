// Mock logger to avoid side effects
jest.mock('@/lib/logger/logger', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { CacheManager, CacheKeys, CacheTags } from '@/lib/cache/cache-manager';

describe('CacheManager', () => {
    beforeEach(() => {
        CacheManager.clear();
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

    describe('set / getCached', () => {
        it('should set and get cached value', () => {
            CacheManager.set('test', 'value');
            expect(CacheManager.getCached('test')).toBe('value');
        });

        it('should return null for non-existent key', () => {
            expect(CacheManager.getCached('nonexistent')).toBeNull();
        });

        it('should return null for expired entry', () => {
            const now = Date.now();
            const spy = jest.spyOn(Date, 'now');
            spy.mockReturnValue(now);
            CacheManager.set('expired', 'data', { ttl: 1 }); // 1s TTL
            // Advance time past TTL
            spy.mockReturnValue(now + 2000);
            expect(CacheManager.getCached('expired')).toBeNull();
            spy.mockRestore();
        });
    });

    describe('invalidate', () => {
        it('should invalidate entries by tag', async () => {
            const fetchFn = jest.fn().mockResolvedValue('data');
            await CacheManager.get('key1', fetchFn, { tags: ['events'] });
            CacheManager.invalidate('events');
            expect(CacheManager.getCached('key1')).toBeNull();
        });
    });

    describe('invalidateKey', () => {
        it('should invalidate a specific key', async () => {
            CacheManager.set('mykey', 'value');
            CacheManager.invalidateKey('mykey');
            expect(CacheManager.getCached('mykey')).toBeNull();
        });
    });

    describe('invalidateTags', () => {
        it('should invalidate multiple tags', async () => {
            const fn = jest.fn().mockResolvedValue('d');
            await CacheManager.get('a', fn, { tags: ['events'] });
            await CacheManager.get('b', fn, { tags: ['vendors'] });
            CacheManager.invalidateTags(['events', 'vendors']);
            expect(CacheManager.getCached('a')).toBeNull();
            expect(CacheManager.getCached('b')).toBeNull();
        });
    });

    describe('clear', () => {
        it('should remove all entries', async () => {
            CacheManager.set('a', 1);
            CacheManager.set('b', 2);
            CacheManager.clear();
            expect(CacheManager.getCached('a')).toBeNull();
            expect(CacheManager.getCached('b')).toBeNull();
        });
    });

    describe('getStats', () => {
        it('should track hits and misses', async () => {
            CacheManager.set('hit', 'data');
            CacheManager.getCached('hit');      // hit
            CacheManager.getCached('miss');     // miss

            const stats = CacheManager.getStats();
            expect(stats.hits).toBe(1);
            expect(stats.misses).toBe(1);
            expect(stats.size).toBe(1);
            expect(stats.hitRate).toBe(50);
        });
    });

    describe('warmup', () => {
        it('should pre-populate cache', async () => {
            await CacheManager.warmup([
                { key: 'warm1', fn: async () => 'w1' },
                { key: 'warm2', fn: async () => 'w2' },
            ]);
            expect(CacheManager.getCached('warm1')).toBe('w1');
            expect(CacheManager.getCached('warm2')).toBe('w2');
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
