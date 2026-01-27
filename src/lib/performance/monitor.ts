/**
 * Performance Monitoring Utility
 * Tracks query performance and logs slow queries
 */

import { logger } from '../logger/logger';

/**
 * Performance thresholds in milliseconds
 */
const THRESHOLDS = {
    FAST: 50,
    ACCEPTABLE: 100,
    SLOW: 200,
    VERY_SLOW: 500,
} as const;

/**
 * Performance metrics storage
 */
const metrics: {
    queries: Map<string, { count: number; totalDuration: number; maxDuration: number }>;
} = {
    queries: new Map(),
};

/**
 * Performance Monitor
 * Wraps async operations to measure and log performance
 */
export class PerformanceMonitor {
    /**
     * Measure the performance of a database query
     * 
     * @param name - Descriptive name for the query
     * @param queryFn - The async function to measure
     * @returns The result of the query function
     * 
     * @example
     * ```typescript
     * const events = await PerformanceMonitor.measureQuery(
     *   'findPublicEvents',
     *   () => supabase.from('events').select('*')
     * );
     * ```
     */
    static async measureQuery<T>(
        name: string,
        queryFn: () => Promise<T>
    ): Promise<T> {
        const start = performance.now();

        try {
            const result = await queryFn();
            const duration = performance.now() - start;

            // Track metrics
            this.trackMetric(name, duration);

            // Log based on duration
            if (duration > THRESHOLDS.VERY_SLOW) {
                logger.error('Very slow query detected', {
                    query: name,
                    duration: `${duration.toFixed(2)}ms`,
                    threshold: `${THRESHOLDS.VERY_SLOW}ms`,
                });
            } else if (duration > THRESHOLDS.SLOW) {
                logger.warn('Slow query detected', {
                    query: name,
                    duration: `${duration.toFixed(2)}ms`,
                    threshold: `${THRESHOLDS.SLOW}ms`,
                });
            } else if (duration > THRESHOLDS.ACCEPTABLE) {
                logger.info('Query completed', {
                    query: name,
                    duration: `${duration.toFixed(2)}ms`,
                    performance: 'acceptable',
                });
            } else {
                logger.debug('Query completed', {
                    query: name,
                    duration: `${duration.toFixed(2)}ms`,
                    performance: 'fast',
                });
            }

            return result;
        } catch (error) {
            const duration = performance.now() - start;

            logger.error('Query failed', {
                query: name,
                duration: `${duration.toFixed(2)}ms`,
                error: error instanceof Error ? error.message : 'Unknown error',
            });

            throw error;
        }
    }

    /**
     * Measure the performance of any async operation
     */
    static async measureOperation<T>(
        name: string,
        operation: () => Promise<T>
    ): Promise<T> {
        return this.measureQuery(name, operation);
    }

    /**
     * Track query metrics for analytics
     */
    private static trackMetric(name: string, duration: number) {
        const existing = metrics.queries.get(name);

        if (existing) {
            existing.count += 1;
            existing.totalDuration += duration;
            existing.maxDuration = Math.max(existing.maxDuration, duration);
        } else {
            metrics.queries.set(name, {
                count: 1,
                totalDuration: duration,
                maxDuration: duration,
            });
        }
    }

    /**
     * Get performance statistics for all tracked queries
     */
    static getStats() {
        const stats = Array.from(metrics.queries.entries()).map(([name, data]) => ({
            name,
            count: data.count,
            averageDuration: data.totalDuration / data.count,
            maxDuration: data.maxDuration,
            totalDuration: data.totalDuration,
        }));

        // Sort by average duration (slowest first)
        stats.sort((a, b) => b.averageDuration - a.averageDuration);

        return stats;
    }

    /**
     * Log performance statistics
     */
    static logStats() {
        const stats = this.getStats();

        if (stats.length === 0) {
            logger.info('No performance data collected yet');
            return;
        }

        logger.info('Performance Statistics', {
            totalQueries: stats.reduce((sum, s) => sum + s.count, 0),
            uniqueQueries: stats.length,
            topSlowQueries: stats.slice(0, 5).map(s => ({
                name: s.name,
                avg: `${s.averageDuration.toFixed(2)}ms`,
                max: `${s.maxDuration.toFixed(2)}ms`,
                count: s.count,
            })),
        });
    }

    /**
     * Reset all metrics
     */
    static resetStats() {
        metrics.queries.clear();
        logger.info('Performance metrics reset');
    }

    /**
     * Get threshold values for reference
     */
    static getThresholds() {
        return THRESHOLDS;
    }
}

/**
 * Decorator for measuring method performance
 * 
 * @example
 * ```typescript
 * class MyService {
 *   @measurePerformance('myMethod')
 *   async myMethod() {
 *     // method implementation
 *   }
 * }
 * ```
 */
export function measurePerformance(operationName: string) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            return PerformanceMonitor.measureOperation(
                operationName || propertyKey,
                () => originalMethod.apply(this, args)
            );
        };

        return descriptor;
    };
}

/**
 * Helper to measure multiple operations in parallel
 */
export async function measureParallel<T>(
    operations: Array<{ name: string; fn: () => Promise<T> }>
): Promise<T[]> {
    const promises = operations.map(op =>
        PerformanceMonitor.measureOperation(op.name, op.fn)
    );

    return Promise.all(promises);
}
