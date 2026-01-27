type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
    [key: string]: any;
}

/**
 * Application logger
 * Provides structured logging with different levels
 */
class Logger {
    private log(level: LogLevel, message: string, context?: LogContext) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            ...context
        };

        // In development, use pretty printing
        if (process.env.NODE_ENV === 'development') {
            const emoji = {
                info: 'ℹ️',
                warn: '⚠️',
                error: '❌',
                debug: '🐛'
            }[level];

            console[level === 'debug' ? 'log' : level](
                `${emoji} [${level.toUpperCase()}] ${message}`,
                context ? context : ''
            );
        } else {
            // In production, use JSON format for log aggregation services
            console[level === 'debug' ? 'log' : level](JSON.stringify(logEntry));
        }
    }

    /**
     * Log informational message
     */
    info(message: string, context?: LogContext) {
        this.log('info', message, context);
    }

    /**
     * Log warning message
     */
    warn(message: string, context?: LogContext) {
        this.log('warn', message, context);
    }

    /**
     * Log error message
     */
    error(message: string, context?: LogContext) {
        this.log('error', message, context);
    }

    /**
     * Log debug message (only in development)
     */
    debug(message: string, context?: LogContext) {
        if (process.env.NODE_ENV === 'development') {
            this.log('debug', message, context);
        }
    }
}

// Singleton instance
export const logger = new Logger();
