import { Resend } from 'resend';
import { logger } from '@/lib/logger/logger';

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

interface SendEmailParams {
    to: string | string[];
    subject: string;
    react?: React.ReactNode;
    html?: string;
}

/**
 * Maximum number of retry attempts for transient failures
 */
const MAX_RETRIES = 3;

/**
 * Base delay in ms for exponential backoff (1s, 2s, 4s)
 */
const BASE_DELAY_MS = 1000;

/**
 * Check if an error is retryable (server errors, timeouts)
 */
function isRetryable(error: any): boolean {
    // Resend 5xx errors
    if (error?.statusCode && error.statusCode >= 500) return true;
    // Network errors
    if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') return true;
    // Generic fetch failures
    if (error?.message?.includes('fetch failed')) return true;
    // Rate limit (429) — retry after backoff
    if (error?.statusCode === 429) return true;
    return false;
}

/**
 * Sleep for the specified duration
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Send an email via Resend with automatic retry for transient failures.
 * Retries up to 3 times with exponential backoff (1s, 2s, 4s).
 * Only retries on 5xx errors and network failures — not on 4xx (invalid request).
 */
export async function sendEmail({ to, subject, react, html }: SendEmailParams) {
    if (!process.env.RESEND_API_KEY || !resend) {
        logger.warn('RESEND_API_KEY is not set. Email not sent.', { to: String(to), subject });
        return { success: false, error: { message: 'Missing API Key' } };
    }

    const fromEmail = 'Nuqta <no-reply@nuqta.ist>';

    // Build email payload - prefer react if provided, fall back to html
    const emailPayload: any = {
        from: fromEmail,
        to,
        subject,
    };

    if (html) {
        emailPayload.html = html;
    } else if (react) {
        emailPayload.react = react;
    }

    let lastError: any = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const { data, error } = await resend.emails.send(emailPayload);

            if (error) {
                lastError = error;

                // Don't retry client errors (4xx) except 429
                if (!isRetryable(error)) {
                    logger.error('Email send failed (non-retryable)', {
                        to: String(to),
                        subject,
                        error,
                        attempt,
                    });
                    return { success: false, error };
                }

                // Retryable error — log and continue
                if (attempt < MAX_RETRIES) {
                    const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
                    logger.warn('Email send failed, retrying', {
                        to: String(to),
                        attempt,
                        maxRetries: MAX_RETRIES,
                        nextRetryMs: delay,
                        error,
                    });
                    await sleep(delay);
                    continue;
                }
            }

            if (data) {
                logger.info('Email sent successfully', {
                    to: String(to),
                    emailId: data.id,
                    attempt,
                });
                return { success: true, data };
            }
        } catch (error: any) {
            lastError = error;

            if (!isRetryable(error) || attempt === MAX_RETRIES) {
                logger.error('Email send exception', {
                    to: String(to),
                    subject,
                    error: error?.message || String(error),
                    attempt,
                });
                return { success: false, error };
            }

            const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
            logger.warn('Email send exception, retrying', {
                to: String(to),
                attempt,
                nextRetryMs: delay,
                error: error?.message,
            });
            await sleep(delay);
        }
    }

    // All retries exhausted
    logger.error('Email send failed after all retries', {
        to: String(to),
        subject,
        totalAttempts: MAX_RETRIES,
        lastError,
    });
    return { success: false, error: lastError };
}
