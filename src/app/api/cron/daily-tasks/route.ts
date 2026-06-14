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
 *   3. Prospect follow-ups — nurture emails for pitched prospects
 *   4. Subscription expiry warnings — warn vendors before subscription expires
 *   5. Onboarding drips — guide new vendors through setup
 *   6. Re-engagement emails — bring back inactive vendors
 *   7. Lead nurture drips — nurture website leads
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
    const url = new URL(request.url);
    const taskFilter = url.searchParams.get('task');

    const supabase = await createAdminClient();
    const notificationService = new NotificationService();

    // ─── Morning-only task: send pending pitches ─────────────────────────
    if (taskFilter === 'pending-pitches') {
        logger.info('Morning cron: sending pending pitches');
        const pendingResult = await sendPendingPitches(supabase, notificationService);
        const summary = {
            success: true,
            task: 'pending-pitches',
            pendingPitches: pendingResult,
            durationMs: Date.now() - startTime,
        };
        logger.info('Morning cron completed', summary);
        return NextResponse.json(summary);
    }

    // ─── Full daily tasks run ────────────────────────────────────────────
    logger.info('Daily tasks cron started', {
        timestamp: new Date().toISOString(),
        hasCronSecret: !!cronSecret,
        hasAuthHeader: !!authHeader,
    });

    const bookingRepo = new BookingRepository(supabase);

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
    const prospectResult = await sendProspectFollowups(supabase, notificationService);

    // ─── Task 4: Subscription Expiry Warnings ────────────────────────────
    const expiryResult = await checkSubscriptionExpiry(supabase, notificationService);

    // ─── Task 5: Onboarding Drip Emails ──────────────────────────────────
    const onboardingResult = await sendOnboardingDrips(supabase, notificationService);

    // ─── Task 6: Re-engagement Emails ────────────────────────────────────
    const reengagementResult = await sendReEngagementEmails(supabase, notificationService);

    // ─── Task 7: Lead Nurture Drips ──────────────────────────────────────
    const leadNurtureResult = await sendLeadNurtureDrips(supabase, notificationService);

    // ─── Task 8: Pending Pitches (also process during evening run) ───────
    const pendingPitchResult = await sendPendingPitches(supabase, notificationService);

    const summary = {
        success: true,
        reminders: reminderResult,
        reviewRequests: reviewResult,
        prospectFollowups: prospectResult,
        subscriptionExpiry: expiryResult,
        onboardingDrips: onboardingResult,
        reengagement: reengagementResult,
        leadNurture: leadNurtureResult,
        pendingPitches: pendingPitchResult,
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

const FOLLOWUP_DAYS = [3, 7]; // Send follow-ups at day 3 and day 7

async function sendProspectFollowups(supabase: any, notificationService: NotificationService) {
    let sentCount = 0;
    let skippedCount = 0;

    try {
        // Get all prospects in 'pitched' status with email
        const { data: prospects } = await supabase
            .from('prospect_vendors')
            .select('id, business_name, contact_email, claim_token, updated_at, notes')
            .eq('status', 'pitched')
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
            const claimUrl = `${siteUrl}/ar/claim/${prospect.claim_token}`;

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

            try {
                await notificationService.sendProspectFollowup({
                    email: prospect.contact_email,
                    businessName: prospect.business_name,
                    claimUrl,
                    interestCount,
                    daysSincePitch: daysSince,
                    locale: 'en',
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

// ─── Subscription Expiry Warnings ────────────────────────────────────────────

async function checkSubscriptionExpiry(supabase: any, notificationService: NotificationService) {
    let warningsSent = 0;
    let downgradedCount = 0;

    try {
        // Get the starter (free) tier ID for downgrading
        const { data: starterTier } = await supabase
            .from('subscription_tiers')
            .select('id')
            .eq('regular_price', 0)
            .single();

        if (!starterTier) {
            logger.error('Could not find starter tier for subscription expiry check');
            return { warningsSent: 0, downgraded: 0, error: 'No starter tier found' };
        }

        const starterTierId = starterTier.id;

        // Query vendors with active paid subscriptions that have expiry dates
        const { data: vendors, error } = await supabase
            .from('vendors')
            .select('id, business_name, subscription_tier, subscription_expires_at, subscription_status, profiles!inner(email, full_name)')
            .not('subscription_expires_at', 'is', null)
            .neq('subscription_tier', starterTierId);

        if (error) {
            logger.error('Failed to query vendors for subscription expiry', { error });
            return { warningsSent: 0, downgraded: 0, error: 'Query failed' };
        }

        if (!vendors || vendors.length === 0) {
            logger.info('No vendors with expiring subscriptions');
            return { warningsSent: 0, downgraded: 0, total: 0 };
        }

        logger.info(`Checking subscription expiry for ${vendors.length} vendors`);

        for (let i = 0; i < vendors.length; i += BATCH_SIZE) {
            const batch = vendors.slice(i, i + BATCH_SIZE);

            await Promise.allSettled(
                batch.map(async (vendor: any) => {
                    const profile = vendor.profiles;
                    const email = profile?.email;
                    const name = profile?.full_name || vendor.business_name;

                    if (!email) {
                        logger.warn('Vendor has no profile email, skipping expiry check', { vendorId: vendor.id });
                        return;
                    }

                    const now = new Date();
                    const expiryDate = new Date(vendor.subscription_expires_at);
                    const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / 86400000);

                    if (daysLeft <= 0) {
                        // Subscription has expired — auto-downgrade to starter
                        const { error: updateError } = await supabase
                            .from('vendors')
                            .update({
                                subscription_tier: starterTierId,
                                subscription_status: 'expired',
                                subscription_expires_at: null,
                            })
                            .eq('id', vendor.id);

                        if (updateError) {
                            logger.error('Failed to downgrade vendor', { vendorId: vendor.id, error: updateError });
                            return;
                        }

                        // Send expired notification
                        try {
                            await notificationService.sendSubscriptionExpired({
                                email,
                                name,
                                businessName: vendor.business_name,
                                locale: 'en',
                            });
                        } catch (err) {
                            logger.error('Failed to send subscription expired email', { vendorId: vendor.id, error: err });
                        }

                        downgradedCount++;
                        logger.info('Vendor subscription expired and downgraded', {
                            vendorId: vendor.id,
                            businessName: vendor.business_name,
                        });
                    } else if ([7, 3, 1].includes(daysLeft)) {
                        // Send warning email
                        try {
                            await notificationService.sendSubscriptionWarning({
                                email,
                                name,
                                businessName: vendor.business_name,
                                daysLeft,
                                locale: 'en',
                            });
                            warningsSent++;
                            logger.info('Subscription warning sent', {
                                vendorId: vendor.id,
                                daysLeft,
                            });
                        } catch (err) {
                            logger.error('Failed to send subscription warning', { vendorId: vendor.id, error: err });
                        }
                    }
                })
            );

            // Rate limit between batches
            if (i + BATCH_SIZE < vendors.length) {
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
            }
        }

        return { total: vendors.length, warningsSent, downgraded: downgradedCount };
    } catch (error) {
        logger.error('Subscription expiry check failed', { error });
        return { warningsSent, downgraded: downgradedCount, error: 'Task failed' };
    }
}

// ─── Onboarding Drip Emails ─────────────────────────────────────────────────

// Map of days since onboarding started → step number
const ONBOARDING_STEP_DAYS: Record<number, number> = {
    1: 1,
    3: 2,
    7: 3,
    14: 4,
    30: 5,
};

async function sendOnboardingDrips(supabase: any, notificationService: NotificationService) {
    let sentCount = 0;
    let skippedCount = 0;

    try {
        // Query vendors who are in the onboarding flow
        const { data: vendors, error } = await supabase
            .from('vendors')
            .select('id, business_name, onboarding_email_step, onboarding_started_at, profiles!inner(email, full_name)')
            .lt('onboarding_email_step', 5)
            .not('onboarding_started_at', 'is', null);

        if (error) {
            logger.error('Failed to query vendors for onboarding drips', { error });
            return { sent: 0, skipped: 0, error: 'Query failed' };
        }

        if (!vendors || vendors.length === 0) {
            logger.info('No vendors need onboarding drips');
            return { total: 0, sent: 0, skipped: 0 };
        }

        logger.info(`Checking onboarding drips for ${vendors.length} vendors`);

        const now = Date.now();

        for (let i = 0; i < vendors.length; i += BATCH_SIZE) {
            const batch = vendors.slice(i, i + BATCH_SIZE);

            await Promise.allSettled(
                batch.map(async (vendor: any) => {
                    const profile = vendor.profiles;
                    const email = profile?.email;

                    if (!email) {
                        skippedCount++;
                        return;
                    }

                    const startedAt = new Date(vendor.onboarding_started_at).getTime();
                    const daysSinceStart = Math.floor((now - startedAt) / 86400000);

                    // Check if this day corresponds to a step
                    const stepForToday = ONBOARDING_STEP_DAYS[daysSinceStart];

                    if (!stepForToday || vendor.onboarding_email_step >= stepForToday) {
                        skippedCount++;
                        return;
                    }

                    try {
                        await notificationService.sendOnboardingDrip({
                            email,
                            name: profile?.full_name || vendor.business_name,
                            businessName: vendor.business_name,
                            step: stepForToday,
                            locale: 'en',
                        });

                        // Update the step
                        await supabase
                            .from('vendors')
                            .update({ onboarding_email_step: stepForToday })
                            .eq('id', vendor.id);

                        sentCount++;
                        logger.info('Onboarding drip sent', {
                            vendorId: vendor.id,
                            step: stepForToday,
                            daysSinceStart,
                        });
                    } catch (err) {
                        logger.error('Failed to send onboarding drip', { vendorId: vendor.id, step: stepForToday, error: err });
                    }
                })
            );

            // Rate limit between batches
            if (i + BATCH_SIZE < vendors.length) {
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
            }
        }

        return { total: vendors.length, sent: sentCount, skipped: skippedCount };
    } catch (error) {
        logger.error('Onboarding drips task failed', { error });
        return { sent: sentCount, skipped: skippedCount, error: 'Task failed' };
    }
}

// ─── Re-engagement Emails ────────────────────────────────────────────────────

const REENGAGEMENT_DAYS = [14, 30, 60]; // Days of inactivity that trigger re-engagement

async function sendReEngagementEmails(supabase: any, notificationService: NotificationService) {
    let sentCount = 0;
    let skippedCount = 0;

    try {
        // Query approved vendors who have been inactive for more than 14 days
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 14);

        const { data: vendors, error } = await supabase
            .from('vendors')
            .select('id, business_name, last_active_at, reengagement_email_sent_at, profiles!inner(email, full_name)')
            .eq('status', 'approved')
            .lt('last_active_at', fourteenDaysAgo.toISOString());

        if (error) {
            logger.error('Failed to query vendors for re-engagement', { error });
            return { sent: 0, skipped: 0, error: 'Query failed' };
        }

        if (!vendors || vendors.length === 0) {
            logger.info('No vendors need re-engagement emails');
            return { total: 0, sent: 0, skipped: 0 };
        }

        logger.info(`Checking re-engagement for ${vendors.length} inactive vendors`);

        const now = Date.now();

        for (let i = 0; i < vendors.length; i += BATCH_SIZE) {
            const batch = vendors.slice(i, i + BATCH_SIZE);

            await Promise.allSettled(
                batch.map(async (vendor: any) => {
                    const profile = vendor.profiles;
                    const email = profile?.email;

                    if (!email) {
                        skippedCount++;
                        return;
                    }

                    // Check if we already sent a re-engagement email recently (within 14 days)
                    if (vendor.reengagement_email_sent_at) {
                        const lastSent = new Date(vendor.reengagement_email_sent_at).getTime();
                        const daysSinceLastSent = Math.floor((now - lastSent) / 86400000);
                        if (daysSinceLastSent < 14) {
                            skippedCount++;
                            return;
                        }
                    }

                    const lastActiveAt = new Date(vendor.last_active_at).getTime();
                    const daysSinceActive = Math.floor((now - lastActiveAt) / 86400000);

                    // Check if days since active matches a re-engagement milestone (±1 day window)
                    const matchesMilestone = REENGAGEMENT_DAYS.some(
                        day => Math.abs(daysSinceActive - day) <= 1
                    );

                    if (!matchesMilestone) {
                        skippedCount++;
                        return;
                    }

                    try {
                        await notificationService.sendReEngagement({
                            email,
                            name: profile?.full_name || vendor.business_name,
                            businessName: vendor.business_name,
                            daysSinceActive,
                            locale: 'en',
                        });

                        // Update re-engagement sent timestamp
                        await supabase
                            .from('vendors')
                            .update({ reengagement_email_sent_at: new Date().toISOString() })
                            .eq('id', vendor.id);

                        sentCount++;
                        logger.info('Re-engagement email sent', {
                            vendorId: vendor.id,
                            daysSinceActive,
                        });
                    } catch (err) {
                        logger.error('Failed to send re-engagement email', { vendorId: vendor.id, error: err });
                    }
                })
            );

            // Rate limit between batches
            if (i + BATCH_SIZE < vendors.length) {
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
            }
        }

        return { total: vendors.length, sent: sentCount, skipped: skippedCount };
    } catch (error) {
        logger.error('Re-engagement emails task failed', { error });
        return { sent: sentCount, skipped: skippedCount, error: 'Task failed' };
    }
}

// ─── Lead Nurture Drip Emails ────────────────────────────────────────────────

// Map of days since lead creation → step number
// Step 1 (day 0) is sent immediately on capture, so we only process steps 2-3 here
const LEAD_NURTURE_STEP_DAYS: Record<number, number> = {
    3: 2,
    7: 3,
};

async function sendLeadNurtureDrips(supabase: any, notificationService: NotificationService) {
    let sentCount = 0;
    let skippedCount = 0;

    try {
        // Query website leads that haven't completed the nurture sequence
        const { data: prospects, error } = await supabase
            .from('prospect_vendors')
            .select('id, business_name, contact_email, lead_nurture_step, created_at')
            .eq('status', 'lead')
            .eq('lead_source', 'website')
            .lt('lead_nurture_step', 3);

        if (error) {
            logger.error('Failed to query prospects for lead nurture', { error });
            return { sent: 0, skipped: 0, error: 'Query failed' };
        }

        if (!prospects || prospects.length === 0) {
            logger.info('No leads need nurture drips');
            return { total: 0, sent: 0, skipped: 0 };
        }

        logger.info(`Checking lead nurture drips for ${prospects.length} prospects`);

        const now = Date.now();

        for (let i = 0; i < prospects.length; i += BATCH_SIZE) {
            const batch = prospects.slice(i, i + BATCH_SIZE);

            await Promise.allSettled(
                batch.map(async (prospect: any) => {
                    if (!prospect.contact_email) {
                        skippedCount++;
                        return;
                    }

                    const createdAt = new Date(prospect.created_at).getTime();
                    const daysSinceCreation = Math.floor((now - createdAt) / 86400000);

                    // Check if this day corresponds to a step
                    const stepForToday = LEAD_NURTURE_STEP_DAYS[daysSinceCreation];

                    if (!stepForToday || prospect.lead_nurture_step >= stepForToday) {
                        skippedCount++;
                        return;
                    }

                    try {
                        await notificationService.sendLeadNurture({
                            email: prospect.contact_email,
                            businessName: prospect.business_name,
                            step: stepForToday,
                            locale: 'en',
                        });

                        // Update the nurture step
                        await supabase
                            .from('prospect_vendors')
                            .update({ lead_nurture_step: stepForToday })
                            .eq('id', prospect.id);

                        sentCount++;
                        logger.info('Lead nurture drip sent', {
                            prospectId: prospect.id,
                            step: stepForToday,
                            daysSinceCreation,
                        });
                    } catch (err) {
                        logger.error('Failed to send lead nurture drip', { prospectId: prospect.id, step: stepForToday, error: err });
                    }
                })
            );

            // Rate limit between batches
            if (i + BATCH_SIZE < prospects.length) {
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
            }
        }

        return { total: prospects.length, sent: sentCount, skipped: skippedCount };
    } catch (error) {
        logger.error('Lead nurture drips task failed', { error });
        return { sent: sentCount, skipped: skippedCount, error: 'Task failed' };
    }
}

// ─── Pending Pitches (queued outside business hours) ─────────────────────────

async function sendPendingPitches(
    supabase: any,
    notificationService: NotificationService,
) {
    let sentCount = 0;
    let failedCount = 0;

    try {
        // Find prospects with [pitch-pending] tag in notes
        const { data: prospects, error } = await supabase
            .from('prospect_vendors')
            .select('id, business_name, contact_email, claim_token, notes')
            .eq('status', 'pitched')
            .like('notes', '%[pitch-pending]%');

        if (error) throw error;
        if (!prospects || prospects.length === 0) {
            logger.info('No pending pitches to send');
            return { total: 0, sent: 0, failed: 0 };
        }

        logger.info(`Found ${prospects.length} pending pitches to send`);

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nuqta.ist';

        for (const prospect of prospects) {
            if (!prospect.contact_email || !prospect.claim_token) {
                // Remove tag but skip sending
                const cleanNotes = (prospect.notes || '').replace(/\n?\[pitch-pending\]/g, '').trim();
                await supabase
                    .from('prospect_vendors')
                    .update({ notes: cleanNotes || null })
                    .eq('id', prospect.id);
                continue;
            }

            try {
                const claimUrl = `${baseUrl}/ar/claim/${prospect.claim_token}`;
                await notificationService.sendProspectFollowup({
                    email: prospect.contact_email,
                    businessName: prospect.business_name,
                    claimUrl,
                    interestCount: 0,
                    daysSincePitch: 0,
                    locale: 'ar',
                });

                // Remove [pitch-pending] tag from notes
                const cleanNotes = (prospect.notes || '').replace(/\n?\[pitch-pending\]/g, '').trim();
                await supabase
                    .from('prospect_vendors')
                    .update({
                        notes: cleanNotes || null,
                        last_contacted_at: new Date().toISOString(),
                    })
                    .eq('id', prospect.id);

                sentCount++;
                logger.info('Pending pitch email sent', { prospectId: prospect.id, email: prospect.contact_email });

                // Rate limit
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
            } catch (err) {
                failedCount++;
                logger.error('Failed to send pending pitch', { prospectId: prospect.id, error: err });
            }
        }

        return { total: prospects.length, sent: sentCount, failed: failedCount };
    } catch (error) {
        logger.error('Pending pitches task failed', { error });
        return { sent: sentCount, failed: failedCount, error: 'Task failed' };
    }
}
