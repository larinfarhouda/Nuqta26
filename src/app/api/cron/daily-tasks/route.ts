import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { BookingRepository } from '@/repositories/booking.repository';
import { NotificationService } from '@/services/notification.service';
import { logger } from '@/lib/logger/logger';

const BATCH_SIZE = 2;
const BATCH_DELAY_MS = 600; // Delay between batches to respect Resend's 2 req/s rate limit

/**
 * GET /api/cron/daily-tasks
 * Vercel Cron Job: runs daily and handles:
 *   1. Event reminders — emails to users with confirmed bookings for events tomorrow
 *   2. Review requests — emails to users who attended events yesterday
 * Secured via CRON_SECRET / Authorization header.
 */
export async function GET(request: Request) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();
    logger.info('Daily tasks cron started');

    const supabase = createAdminClient();
    const bookingRepo = new BookingRepository(supabase);
    const notificationService = new NotificationService();

    // Calculate date ranges in Istanbul timezone
    const now = new Date();
    const istanbulFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Istanbul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const todayStr = istanbulFormatter.format(now);
    const todayDate = new Date(todayStr + 'T00:00:00+03:00');

    // Tomorrow range (for reminders)
    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStart = tomorrowDate.toISOString();
    const tomorrowEndDate = new Date(tomorrowDate);
    tomorrowEndDate.setHours(23, 59, 59, 999);
    const tomorrowEnd = tomorrowEndDate.toISOString();

    // Yesterday range (for review requests)
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStart = yesterdayDate.toISOString();
    const yesterdayEndDate = new Date(yesterdayDate);
    yesterdayEndDate.setHours(23, 59, 59, 999);
    const yesterdayEnd = yesterdayEndDate.toISOString();

    const reminderResult = await sendEventReminders(
        supabase, bookingRepo, notificationService, tomorrowStart, tomorrowEnd
    );

    // ─── Task 2: Review Requests ─────────────────────────────────────────
    const reviewResult = await sendReviewRequests(
        supabase, bookingRepo, notificationService, yesterdayStart, yesterdayEnd
    );

    const summary = {
        success: true,
        reminders: reminderResult,
        reviewRequests: reviewResult,
        durationMs: Date.now() - startTime,
    };

    logger.info('Daily tasks cron completed', summary);
    return NextResponse.json(summary);
}

// ─── Event Reminders ─────────────────────────────────────────────────────────

async function sendEventReminders(
    supabase: any,
    bookingRepo: BookingRepository,
    notificationService: NotificationService,
    tomorrowStart: string,
    tomorrowEnd: string,
) {
    let sentCount = 0;
    let failedCount = 0;
    const errors: Array<{ bookingId: string, error: string }> = [];

    try {
        logger.info('Reminder date range', { tomorrowStart, tomorrowEnd });

        const bookings = await bookingRepo.findBookingsForReminder(tomorrowStart, tomorrowEnd);

        if (bookings.length === 0) {
            logger.info('No bookings need reminders');
            return { total: 0, sent: 0, failed: 0 };
        }

        logger.info(`Found ${bookings.length} bookings needing reminders`);

        const successfulIds: string[] = [];

        for (let i = 0; i < bookings.length; i += BATCH_SIZE) {
            const batch = bookings.slice(i, i + BATCH_SIZE);

            const results = await Promise.allSettled(
                batch.map(async (booking) => {
                    const event = booking.events as any;
                    let email = booking.contact_email;
                    let name = booking.contact_name;

                    // Fall back to profile data if contact fields are missing
                    if (!email || !name) {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('email, full_name')
                            .eq('id', booking.user_id)
                            .single();
                        if (!email) email = profile?.email;
                        if (!name) name = profile?.full_name || 'Guest';
                    }

                    if (!email) {
                        logger.warn('Booking has no contact or profile email, skipping', { bookingId: booking.id });
                        throw new Error('No contact email');
                    }

                    let locationUrl: string | undefined;
                    if (event.location_lat && event.location_long) {
                        locationUrl = `https://www.google.com/maps?q=${event.location_lat},${event.location_long}`;
                    }

                    let eventTime: string | undefined;
                    if (event.date) {
                        const date = new Date(event.date);
                        eventTime = date.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                            timeZone: 'UTC',
                        });
                    }

                    await notificationService.sendEventReminder({
                        customerEmail: email!,
                        customerName: name || 'Guest',
                        eventTitle: event.title,
                        eventDate: event.date,
                        eventTime,
                        location: event.location_name || 'TBA',
                        locationUrl,
                        bookingId: booking.id,
                        locale: 'ar',
                    });
                })
            );

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    sentCount++;
                    successfulIds.push(batch[index].id);
                } else {
                    failedCount++;
                    const errMsg = result.reason?.message || String(result.reason);
                    errors.push({ bookingId: batch[index].id, error: errMsg });
                    logger.error('Failed to send reminder', {
                        bookingId: batch[index].id,
                        error: errMsg,
                    });
                }
            });

            // Add delay between batches to respect Resend rate limit
            if (i + BATCH_SIZE < bookings.length) {
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
            }
        }

        if (successfulIds.length > 0) {
            await bookingRepo.markReminderSent(successfulIds);
        }

        return { total: bookings.length, sent: sentCount, failed: failedCount, errors };
    } catch (error) {
        logger.error('Event reminders task failed', { error });
        return { total: 0, sent: sentCount, failed: failedCount, error: 'Task failed', details: String(error) };
    }
}

// ─── Review Requests ─────────────────────────────────────────────────────────

async function sendReviewRequests(
    supabase: any,
    bookingRepo: BookingRepository,
    notificationService: NotificationService,
    yesterdayStart: string,
    yesterdayEnd: string,
) {
    let sentCount = 0;
    let failedCount = 0;

    try {
        logger.info('Review request date range', { yesterdayStart, yesterdayEnd });

        const bookings = await bookingRepo.findBookingsForReviewRequest(yesterdayStart, yesterdayEnd);

        if (bookings.length === 0) {
            logger.info('No bookings need review requests');
            return { total: 0, sent: 0, failed: 0 };
        }

        logger.info(`Found ${bookings.length} bookings needing review requests`);

        const successfulIds: string[] = [];

        for (let i = 0; i < bookings.length; i += BATCH_SIZE) {
            const batch = bookings.slice(i, i + BATCH_SIZE);

            const results = await Promise.allSettled(
                batch.map(async (booking) => {
                    const event = booking.events as any;
                    let email = booking.contact_email;
                    let name = booking.contact_name;

                    // Fall back to profile data if contact fields are missing
                    if (!email || !name) {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('email, full_name')
                            .eq('id', booking.user_id)
                            .single();
                        if (!email) email = profile?.email;
                        if (!name) name = profile?.full_name || 'Guest';
                    }

                    if (!email) {
                        logger.warn('Booking has no contact or profile email, skipping review request', { bookingId: booking.id });
                        throw new Error('No contact email');
                    }

                    if (!event.slug) {
                        logger.warn('Event has no slug, skipping review request', { bookingId: booking.id, eventId: event.id });
                        throw new Error('No event slug');
                    }

                    await notificationService.sendReviewRequest({
                        customerEmail: email!,
                        customerName: name || 'Guest',
                        eventTitle: event.title,
                        eventSlug: event.slug,
                        locale: 'ar',
                    });
                })
            );

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    sentCount++;
                    successfulIds.push(batch[index].id);
                } else {
                    failedCount++;
                    logger.error('Failed to send review request', {
                        bookingId: batch[index].id,
                        error: result.reason?.message,
                    });
                }
            });

            // Add delay between batches to respect Resend rate limit
            if (i + BATCH_SIZE < bookings.length) {
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
            }
        }

        if (successfulIds.length > 0) {
            await bookingRepo.markReviewRequestSent(successfulIds);
        }

        return { total: bookings.length, sent: sentCount, failed: failedCount };
    } catch (error) {
        logger.error('Review requests task failed', { error });
        return { total: 0, sent: sentCount, failed: failedCount, error: 'Task failed' };
    }
}
