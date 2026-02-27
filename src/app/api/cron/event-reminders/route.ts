import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { BookingRepository } from '@/repositories/booking.repository';
import { NotificationService } from '@/services/notification.service';
import { logger } from '@/lib/logger/logger';

const BATCH_SIZE = 10;

/**
 * GET /api/cron/event-reminders
 * Vercel Cron Job: sends reminder emails to users with confirmed bookings
 * for events happening tomorrow (Istanbul timezone).
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
    logger.info('Event reminder cron started');

    try {
        // Calculate tomorrow's date range in Istanbul timezone
        const now = new Date();
        const istanbulFormatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Europe/Istanbul',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        // Get today in Istanbul, then compute tomorrow
        const todayStr = istanbulFormatter.format(now);
        const todayDate = new Date(todayStr + 'T00:00:00+03:00');
        const tomorrowDate = new Date(todayDate);
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);

        const tomorrowStart = tomorrowDate.toISOString();
        const tomorrowEndDate = new Date(tomorrowDate);
        tomorrowEndDate.setHours(23, 59, 59, 999);
        const tomorrowEnd = tomorrowEndDate.toISOString();

        logger.info('Reminder date range', { tomorrowStart, tomorrowEnd });

        // Use admin client (bypasses RLS, no user context needed)
        const supabase = createAdminClient();
        const bookingRepo = new BookingRepository(supabase);
        const notificationService = new NotificationService();

        // Single optimized query
        const bookings = await bookingRepo.findBookingsForReminder(tomorrowStart, tomorrowEnd);

        if (bookings.length === 0) {
            logger.info('No bookings need reminders');
            return NextResponse.json({
                success: true,
                total: 0,
                sent: 0,
                failed: 0,
                durationMs: Date.now() - startTime,
            });
        }

        logger.info(`Found ${bookings.length} bookings needing reminders`);

        let sentCount = 0;
        let failedCount = 0;
        const successfulIds: string[] = [];

        // Process in batches to avoid rate limits
        for (let i = 0; i < bookings.length; i += BATCH_SIZE) {
            const batch = bookings.slice(i, i + BATCH_SIZE);

            const results = await Promise.allSettled(
                batch.map(async (booking) => {
                    const event = booking.events as any;
                    const email = booking.contact_email;
                    const name = booking.contact_name || 'Guest';

                    if (!email) {
                        logger.warn('Booking has no contact email, skipping', { bookingId: booking.id });
                        throw new Error('No contact email');
                    }

                    // Build Google Maps URL if coordinates exist
                    let locationUrl: string | undefined;
                    if (event.location_lat && event.location_long) {
                        locationUrl = `https://www.google.com/maps?q=${event.location_lat},${event.location_long}`;
                    }

                    // Format event time
                    let eventTime: string | undefined;
                    if (event.date) {
                        const date = new Date(event.date);
                        eventTime = date.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                            timeZone: 'Europe/Istanbul',
                        });
                    }

                    await notificationService.sendEventReminder({
                        customerEmail: email,
                        customerName: name,
                        eventTitle: event.title,
                        eventDate: event.date,
                        eventTime,
                        location: event.location_name || 'TBA',
                        locationUrl,
                        bookingId: booking.id,
                        locale: 'ar', // Default to Arabic (primary locale)
                    });
                })
            );

            // Track results
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    sentCount++;
                    successfulIds.push(batch[index].id);
                } else {
                    failedCount++;
                    logger.error('Failed to send reminder', {
                        bookingId: batch[index].id,
                        error: result.reason?.message,
                    });
                }
            });
        }

        // Batch mark all successful ones as sent
        if (successfulIds.length > 0) {
            await bookingRepo.markReminderSent(successfulIds);
        }

        const summary = {
            success: true,
            total: bookings.length,
            sent: sentCount,
            failed: failedCount,
            durationMs: Date.now() - startTime,
        };

        logger.info('Event reminder cron completed', summary);
        return NextResponse.json(summary);
    } catch (error) {
        logger.error('Event reminder cron failed', { error });
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
