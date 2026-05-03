/**
 * Application Logger
 * Structured logging with request context tracing.
 * 
 * - Development: Pretty-printed with emojis
 * - Production: JSON format with requestId, userId, duration
 * - Log level configurable via LOG_LEVEL env var
 * 
 * Automatically includes request context (requestId, userId) when
 * running inside a withRequestContext() wrapper.
 */

import { getRequestContext } from './request-context';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
    [key: string]: any;
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

/**
 * Get the minimum log level from env.
 * Default: 'debug' in development, 'info' in production.
 */
function getMinLevel(): number {
    const envLevel = process.env.LOG_LEVEL as LogLevel | undefined;
    if (envLevel && envLevel in LOG_LEVELS) {
        return LOG_LEVELS[envLevel];
    }
    return process.env.NODE_ENV === 'development' ? LOG_LEVELS.debug : LOG_LEVELS.info;
}

class Logger {
    private shouldLog(level: LogLevel): boolean {
        return LOG_LEVELS[level] >= getMinLevel();
    }

    private log(level: LogLevel, message: string, context?: LogContext) {
        if (!this.shouldLog(level)) return;

        const timestamp = new Date().toISOString();
        const reqCtx = getRequestContext();

        // Build structured log entry
        const logEntry: Record<string, any> = {
            timestamp,
            level,
            message,
        };

        // Add request context if available
        if (reqCtx) {
            logEntry.requestId = reqCtx.requestId;
            if (reqCtx.userId) logEntry.userId = reqCtx.userId;
            logEntry.durationMs = Date.now() - reqCtx.startTime;
        }

        // Merge additional context
        if (context) {
            // Serialize Error objects for JSON output
            for (const [key, value] of Object.entries(context)) {
                if (value instanceof Error) {
                    logEntry[key] = {
                        name: value.name,
                        message: value.message,
                        stack: value.stack?.split('\n').slice(0, 3).join('\n'),
                    };
                } else {
                    logEntry[key] = value;
                }
            }
        }

        // Output format
        if (process.env.NODE_ENV === 'development') {
            const emoji = { debug: '🐛', info: 'ℹ️', warn: '⚠️', error: '❌' }[level];
            const reqId = reqCtx?.requestId ? ` [${reqCtx.requestId.slice(0, 8)}]` : '';
            const consoleFn = level === 'debug' ? 'log' : level;
            console[consoleFn](
                `${emoji}${reqId} ${message}`,
                context ? context : ''
            );
        } else {
            // Production: JSON for log aggregation (Vercel, Datadog, etc.)
            const consoleFn = level === 'debug' ? 'log' : level;
            console[consoleFn](JSON.stringify(logEntry));
        }
    }

    /** Log informational message */
    info(message: string, context?: LogContext) {
        this.log('info', message, context);
    }

    /** Log warning message */
    warn(message: string, context?: LogContext) {
        this.log('warn', message, context);
    }

    /** Log error message */
    error(message: string, context?: LogContext) {
        this.log('error', message, context);
    }

    /** Log debug message */
    debug(message: string, context?: LogContext) {
        this.log('debug', message, context);
    }
}

// Singleton instance
export const logger = new Logger();
