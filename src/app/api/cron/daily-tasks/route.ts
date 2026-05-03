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
    // ─── Auth: Verify CRON_SECRET ────────────────────────────────────────
    // Vercel automatically sends Authorization: Bearer <CRON_SECRET> header
    // when triggering cron jobs. CRON_SECRET must be set in Vercel Dashboard
    // under Settings → Environment Variables.
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        logger.error('CRON_SECRET environment variable is not set! Cron jobs will not work securely.');
        // Still allow request to proceed for backward compatibility,
        // but log an error so it's visible in Vercel logs
    }

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        logger.warn('Cron request rejected: invalid authorization header');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();
    logger.info('Daily tasks cron started', {
        timestamp: new Date().toISOString(),
        hasCronSecret: !!cronSecret,
        hasAuthHeader: !!authHeader,
    });

    const supabase = createAdminClient();
    const bookingRepo = new BookingRepository(supabase);
    const notificationService = new NotificationService();

    // ─── Calculate date ranges (UTC-based for database comparison) ────────
    const now = new Date();

    // Tomorrow range (for reminders — events happening tomorrow)
    const tomorrowDate = new Date(now);
    tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
    const tomorrowStart = new Date(Date.UTC(
        tomorrowDate.getUTCFullYear(),
        tomorrowDate.getUTCMonth(),
        tomorrowDate.getUTCDate(),
        0, 0, 0, 0
    )).toISOString();
    const tomorrowEnd = new Date(Date.UTC(
        tomorrowDate.getUTCFullYear(),
        tomorrowDate.getUTCMonth(),
        tomorrowDate.getUTCDate(),
        23, 59, 59, 999
    )).toISOString();

    // Yesterday range (for review requests — events that ended yesterday)
    const yesterdayDate = new Date(now);
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
    const yesterdayStart = new Date(Date.UTC(
        yesterdayDate.getUTCFullYear(),
        yesterdayDate.getUTCMonth(),
        yesterdayDate.getUTCDate(),
        0, 0, 0, 0
    )).toISOString();
    const yesterdayEnd = new Date(Date.UTC(
        yesterdayDate.getUTCFullYear(),
        yesterdayDate.getUTCMonth(),
        yesterdayDate.getUTCDate(),
        23, 59, 59, 999
    )).toISOString();

    logger.info('Date ranges calculated', {
        now: now.toISOString(),
        tomorrowStart,
        tomorrowEnd,
        yesterdayStart,
        yesterdayEnd,
    });

    // ─── Task 1: Event Reminders ─────────────────────────────────────────
    const reminderResult = await sendEventReminders(
        supabase, bookingRepo, notificationService, tomorrowStart, tomorrowEnd
    );

    // ─── Task 2: Review Requests ─────────────────────────────────────────
    const reviewResult = await sendReviewRequests(
        supabase, bookingRepo, notificationService, yesterdayStart, yesterdayEnd
    );

    // ─── Task 3: Prospect Follow-up Emails ───────────────────────────────
    const prospectResult = await sendProspectFollowups(supabase);

    const summary = {
        success: true,
        reminders: reminderResult,
        reviewRequests: reviewResult,
        prospectFollowups: prospectResult,
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

// ─── Prospect Follow-up Emails ───────────────────────────────────────────────

import { sendEmail } from '@/utils/mail';

const FOLLOWUP_DAYS = [3, 7]; // Send follow-ups at day 3 and day 7

async function sendProspectFollowups(supabase: any) {
    let sentCount = 0;
    let skippedCount = 0;

    try {
        // Get all prospects in 'contacted' status with email
        const { data: prospects } = await supabase
            .from('prospect_vendors')
            .select('id, business_name, contact_email, claim_token, updated_at, notes')
            .eq('status', 'contacted')
            .not('contact_email', 'is', null)
            .not('claim_token', 'is', null);

        if (!prospects || prospects.length === 0) {
            return { total: 0, sent: 0, skipped: 0 };
        }

        const now = Date.now();

        for (const prospect of prospects) {
            const contactedAt = new Date(prospect.updated_at).getTime();
            const daysSince = Math.floor((now - contactedAt) / 86400000);

            // Check if today matches a follow-up day
            if (!FOLLOWUP_DAYS.includes(daysSince)) {
                skippedCount++;
                continue;
            }

            // Check if we already sent this follow-up (tracked in notes)
            const followupTag = `[followup-day-${daysSince}]`;
            if (prospect.notes?.includes(followupTag)) {
                skippedCount++;
                continue;
            }

            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nuqta.ist';
            const claimUrl = `${siteUrl}/claim/${prospect.claim_token}`;

            // Get interest count for this prospect
            const { data: events } = await supabase
                .from('events')
                .select('id')
                .eq('prospect_vendor_id', prospect.id);
            let interestCount = 0;
            if (events?.length > 0) {
                const { count } = await supabase
                    .from('event_interests')
                    .select('*', { count: 'exact', head: true })
                    .in('event_id', events.map((e: any) => e.id));
                interestCount = count || 0;
            }

            const isDay3 = daysSince === 3;
            const subject = isDay3
                ? `Reminder: ${prospect.business_name}, your Nuqta page is waiting!`
                : `Last chance: Claim your Nuqta page, ${prospect.business_name}`;

            const body = isDay3
                ? `Hi ${prospect.business_name},\n\nJust a friendly reminder — we created a page for you on Nuqta a few days ago.${interestCount > 0 ? ` ${interestCount} people have already expressed interest in your events!` : ''}\n\nClaim your free page to start managing bookings:\n${claimUrl}\n\nBest regards,\nThe Nuqta Team`
                : `Hi ${prospect.business_name},\n\nWe reached out last week about your page on Nuqta.${interestCount > 0 ? ` ${interestCount} people are interested in your events — don't miss out!` : ' People are discovering your events on our platform.'}\n\nThis is the last automated reminder. Claim your free page anytime:\n${claimUrl}\n\nWe'd love to have you on board!\nThe Nuqta Team`;

            try {
                await sendEmail({
                    to: prospect.contact_email,
                    subject,
                    html: body.replace(/\n/g, '<br>'),
                });

                // Mark this follow-up as sent in notes
                const currentNotes = prospect.notes || '';
                await supabase
                    .from('prospect_vendors')
                    .update({ notes: `${currentNotes} ${followupTag}`.trim() })
                    .eq('id', prospect.id);

                sentCount++;
                logger.info('Prospect follow-up sent', { prospectId: prospect.id, day: daysSince });
            } catch (err) {
                logger.error('Failed to send prospect follow-up', { prospectId: prospect.id, error: err });
            }

            // Rate limit: 600ms between emails
            await new Promise(resolve => setTimeout(resolve, 600));
        }

        return { total: prospects.length, sent: sentCount, skipped: skippedCount };
    } catch (error) {
        logger.error('Prospect follow-up task failed', { error });
        return { total: 0, sent: sentCount, skipped: skippedCount, error: 'Task failed' };
    }
}
