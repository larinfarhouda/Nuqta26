/**
 * Request Context
 * Uses AsyncLocalStorage to propagate request-scoped data (requestId, userId)
 * through the entire call chain without passing it as parameters.
 * 
 * @example
 * ```typescript
 * // In middleware or action entry point:
 * withRequestContext({ requestId: 'abc-123', userId: 'user-1' }, async () => {
 *     // Anywhere in the call chain:
 *     const ctx = getRequestContext();
 *     console.log(ctx.requestId); // 'abc-123'
 * });
 * ```
 */

import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
    /** Unique request identifier for tracing */
    requestId: string;
    /** Authenticated user ID (if available) */
    userId?: string;
    /** Request start time for duration tracking */
    startTime: number;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Run a function within a request context.
 * All logger calls within this function (and its callees) will automatically
 * include the requestId and userId in their output.
 */
export function withRequestContext<T>(
    context: Omit<RequestContext, 'startTime'>,
    fn: () => T
): T {
    return asyncLocalStorage.run(
        { ...context, startTime: Date.now() },
        fn
    );
}

/**
 * Get the current request context.
 * Returns undefined if called outside a withRequestContext wrapper.
 */
export function getRequestContext(): RequestContext | undefined {
    return asyncLocalStorage.getStore();
}
