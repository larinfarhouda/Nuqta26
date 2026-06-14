'use server';

import { createClient, createAdminClient } from '@/utils/supabase/server';
import { ServiceFactory } from '@/services/service-factory';
import { logger } from '@/lib/logger/logger';

// ─── Admin Guard ────────────────────────────────────────────────────────────

async function requireAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') throw new Error('Forbidden: Admin access required');

    return { user, supabase };
}

async function getAdminService() {
    const adminClient = await createAdminClient();
    const factory = new ServiceFactory(adminClient);
    return factory.getAdminService();
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export async function getAdminDashboardData() {
    try {
        await requireAdmin();
        const service = await getAdminService();
        return await service.getDashboardData();
    } catch (error) {
        logger.error('Failed to get admin dashboard data', { error });
        return null;
    }
}

// ─── Vendor Management ──────────────────────────────────────────────────────

export async function getAdminVendors(page = 1, pageSize = 20, search?: string, tier?: string) {
    try {
        await requireAdmin();
        const service = await getAdminService();
        return await service.getVendorDirectory({ page, pageSize, search, tier });
    } catch (error) {
        logger.error('Failed to get admin vendors', { error });
        return null;
    }
}

export async function approveVendor(vendorId: string) {
    try {
        const { user } = await requireAdmin();
        const service = await getAdminService();
        await service.approveVendor(vendorId, user.id);
        return { success: true };
    } catch (error) {
        logger.error('Failed to approve vendor', { error });
        return { error: 'Failed to approve vendor' };
    }
}

export async function suspendVendor(vendorId: string) {
    try {
        const { user } = await requireAdmin();
        const service = await getAdminService();
        await service.suspendVendor(vendorId, user.id);
        return { success: true };
    } catch (error) {
        logger.error('Failed to suspend vendor', { error });
        return { error: 'Failed to suspend vendor' };
    }
}

export async function getVendorFullDetails(vendorId: string) {
    try {
        // Run auth check in parallel with service creation
        const [_, service] = await Promise.all([
            requireAdmin(),
            getAdminService(),
        ]);
        return await service.getVendorFullDetails(vendorId);
    } catch (error) {
        logger.error('Failed to get vendor full details', { error });
        return null;
    }
}

export async function updateVendorSubscription(vendorId: string, tier: string, billingPeriod: string) {
    try {
        const { user } = await requireAdmin();
        const service = await getAdminService();
        await service.updateVendorSubscription(vendorId, tier, billingPeriod, user.id);
        return { success: true };
    } catch (error) {
        logger.error('Failed to update vendor subscription', { error });
        return { error: 'Failed to update subscription' };
    }
}

export async function updateVendorDetails(vendorId: string, updates: Record<string, any>) {
    try {
        const { user } = await requireAdmin();
        const service = await getAdminService();
        await service.updateVendorDetails(vendorId, updates, user.id);
        return { success: true };
    } catch (error) {
        logger.error('Failed to update vendor details', { error });
        return { error: 'Failed to update vendor details' };
    }
}

export async function impersonateVendor(vendorId: string) {
    try {
        const { user } = await requireAdmin();
        const adminClient = await createAdminClient();

        // Get vendor's email from profiles
        const { data: profile } = await adminClient
            .from('profiles')
            .select('email')
            .eq('id', vendorId)
            .single();

        if (!profile?.email) {
            return { error: 'Vendor email not found' };
        }

        // Generate a magic link for the vendor
        const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
            type: 'magiclink',
            email: profile.email,
        });

        if (linkError || !linkData) {
            logger.error('Failed to generate impersonation link', { linkError });
            return { error: 'Failed to generate login link' };
        }

        // Log the impersonation
        const service = await getAdminService();
        await service.logActivity({
            user_id: user.id,
            action: 'vendor_impersonated',
            entity_type: 'vendor',
            entity_id: vendorId,
            metadata: { vendor_email: profile.email },
        });

        // The generateLink response contains properties.action_link with the full URL
        // We need to extract the token_hash and build our own callback URL
        const actionLink = linkData.properties?.action_link;
        if (!actionLink) {
            return { error: 'Failed to generate token' };
        }

        // Parse the action link to extract the token
        const url = new URL(actionLink);
        const tokenHash = url.searchParams.get('token') || url.searchParams.get('token_hash');

        // Build callback URL through our auth/callback using verifyOtp approach
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const magicLink = actionLink.replace(url.origin, siteUrl);

        return { success: true, url: magicLink };
    } catch (error) {
        logger.error('Failed to impersonate vendor', { error });
        return { error: 'Failed to impersonate vendor' };
    }
}

// ─── Booking (Bank Transfer) Management ─────────────────────────────────────

export async function getAdminBankTransfers(page = 1, pageSize = 20) {
    try {
        await requireAdmin();
        const service = await getAdminService();
        return await service.getBankTransferQueue(page, pageSize);
    } catch (error) {
        logger.error('Failed to get bank transfers', { error });
        return null;
    }
}

export async function confirmBankPayment(bookingId: string) {
    try {
        const { user } = await requireAdmin();
        const service = await getAdminService();
        await service.confirmPayment(bookingId, user.id);
        return { success: true };
    } catch (error) {
        logger.error('Failed to confirm payment', { error });
        return { error: 'Failed to confirm payment' };
    }
}

export async function rejectBankPayment(bookingId: string) {
    try {
        const { user } = await requireAdmin();
        const service = await getAdminService();
        await service.rejectPayment(bookingId, user.id);
        return { success: true };
    } catch (error) {
        logger.error('Failed to reject payment', { error });
        return { error: 'Failed to reject payment' };
    }
}

// ─── Moderation ─────────────────────────────────────────────────────────────

export async function getAdminFlaggedReviews(page = 1, pageSize = 20) {
    try {
        await requireAdmin();
        const service = await getAdminService();
        return await service.getFlaggedReviews(page, pageSize);
    } catch (error) {
        logger.error('Failed to get flagged reviews', { error });
        return null;
    }
}

export async function unflagReview(reviewId: string) {
    try {
        await requireAdmin();
        const service = await getAdminService();
        await service.unflagReview(reviewId);
        return { success: true };
    } catch (error) {
        logger.error('Failed to unflag review', { error });
        return { error: 'Failed to unflag review' };
    }
}

export async function deleteReview(reviewId: string) {
    try {
        await requireAdmin();
        const service = await getAdminService();
        await service.deleteReview(reviewId);
        return { success: true };
    } catch (error) {
        logger.error('Failed to delete review', { error });
        return { error: 'Failed to delete review' };
    }
}

export async function toggleFeatureEvent(eventId: string, featured: boolean) {
    try {
        const { user } = await requireAdmin();
        const service = await getAdminService();
        await service.toggleFeatureEvent(eventId, featured, user.id);
        return { success: true };
    } catch (error) {
        logger.error('Failed to toggle feature event', { error });
        return { error: 'Failed to toggle feature event' };
    }
}

// ─── Prospect Vendors (Phantom Listings) ────────────────────────────────────

export async function createProspectVendor(data: {
    business_name: string;
    logo_url?: string;
    contact_email?: string;
    contact_phone?: string;
    instagram?: string;
    website?: string;
    notes?: string;
    bio?: string;
    location?: string;
}) {
    try {
        const { user } = await requireAdmin();
        const service = await getAdminService();
        const prospect = await service.createProspectVendor(data, user.id);
        return { success: true, prospect };
    } catch (error) {
        logger.error('Failed to create prospect vendor', { error });
        return { error: 'Failed to create prospect vendor' };
    }
}

export async function getAdminProspects(page = 1, pageSize = 20, status?: string) {
    try {
        await requireAdmin();
        const service = await getAdminService();
        return await service.getProspects(page, pageSize, status);
    } catch (error) {
        logger.error('Failed to get prospects', { error });
        return null;
    }
}

export async function getProspectStats() {
    try {
        await requireAdmin();
        const adminClient = await createAdminClient();

        // Get all prospects with status counts
        const { data: all } = await adminClient.from('prospect_vendors').select('id, status, created_at, updated_at');
        const prospects = all || [];

        const total = prospects.length;
        const byStatus = { lead: 0, building: 0, pitched: 0, free: 0, paying: 0, churned: 0, lost: 0 };
        let totalConversionDays = 0;
        let convertedCount = 0;

        prospects.forEach(p => {
            if (p.status && p.status in byStatus) {
                byStatus[p.status as keyof typeof byStatus]++;
            }
            if ((p.status === 'free' || p.status === 'paying') && p.created_at && p.updated_at) {
                const days = (new Date(p.updated_at).getTime() - new Date(p.created_at).getTime()) / 86400000;
                totalConversionDays += days;
                convertedCount++;
            }
        });

        // Get total interests across all prospect events
        const prospectIds = prospects.map(p => p.id);
        let totalInterests = 0;
        if (prospectIds.length > 0) {
            const { data: events } = await adminClient
                .from('events')
                .select('id')
                .in('prospect_vendor_id', prospectIds);
            if (events && events.length > 0) {
                const { count } = await adminClient
                    .from('event_interests')
                    .select('*', { count: 'exact', head: true })
                    .in('event_id', events.map(e => e.id));
                totalInterests = count || 0;
            }
        }

        return {
            total,
            byStatus,
            conversionRate: total > 0 ? Math.round(((byStatus.free + byStatus.paying) / total) * 100) : 0,
            avgConversionDays: convertedCount > 0 ? Math.round(totalConversionDays / convertedCount) : null,
            totalInterests,
        };
    } catch (error) {
        logger.error('Failed to get prospect stats', { error });
        return null;
    }
}

export async function bulkCreateProspects(prospects: {
    business_name: string;
    contact_email?: string;
    contact_phone?: string;
    instagram?: string;
    website?: string;
    notes?: string;
}[]) {
    try {
        const { user } = await requireAdmin();
        const service = await getAdminService();
        let created = 0;
        let failed = 0;

        for (const p of prospects) {
            if (!p.business_name) { failed++; continue; }
            try {
                await service.createProspectVendor(p, user.id);
                created++;
            } catch {
                failed++;
            }
        }

        return { success: true, created, failed };
    } catch (error) {
        logger.error('Failed to bulk create prospects', { error });
        return { error: 'Failed to bulk create prospects' };
    }
}

export async function contactProspect(prospectId: string) {
    try {
        const { user } = await requireAdmin();
        const service = await getAdminService();
        const claimToken = await service.contactProspect(prospectId, user.id);
        const claimUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nuqta.ist'}/ar/claim/${claimToken}`;
        return { success: true, claimUrl, claimToken };
    } catch (error) {
        logger.error('Failed to contact prospect', { error });
        return { error: 'Failed to contact prospect' };
    }
}

export async function createProspectEvent(data: {
    prospect_vendor_id: string;
    title: string;
    description?: string;
    image_url?: string;
    date: string;
    end_date?: string;
    location_name?: string;
    location_lat?: number;
    location_long?: number;
    district?: string;
    city?: string;
    country?: string;
    capacity?: number;
    event_type?: string;
}) {
    try {
        await requireAdmin();
        const service = await getAdminService();

        // Get system vendor ID
        const adminClient = await createAdminClient();
        const { data: systemVendor } = await adminClient
            .from('vendors')
            .select('id')
            .eq('slug', 'nuqta-platform')
            .single();

        if (!systemVendor) {
            return { error: 'System vendor account not found. Please create the Nuqta Platform vendor first.' };
        }

        const event = await service.createProspectEvent(data, systemVendor.id);
        return { success: true, event };
    } catch (error) {
        logger.error('Failed to create prospect event', { error });
        return { error: 'Failed to create prospect event' };
    }
}

export async function getProspectInterests(prospectId: string) {
    try {
        await requireAdmin();
        const service = await getAdminService();
        return await service.getProspectInterests(prospectId);
    } catch (error) {
        logger.error('Failed to get prospect interests', { error });
        return [];
    }
}

export async function updateProspectVendor(prospectId: string, data: {
    business_name: string;
    logo_url?: string;
    contact_email?: string;
    contact_phone?: string;
    instagram?: string;
    website?: string;
    notes?: string;
    bio?: string;
    location?: string;
}) {
    try {
        const { user } = await requireAdmin();
        const service = await getAdminService();
        await service.updateProspectVendor(prospectId, data, user.id);
        return { success: true };
    } catch (error) {
        logger.error('Failed to update prospect vendor', { error });
        return { error: 'Failed to update prospect vendor' };
    }
}

export async function deleteProspectVendor(prospectId: string) {
    try {
        const { user } = await requireAdmin();
        const service = await getAdminService();
        await service.deleteProspectVendor(prospectId, user.id);
        return { success: true };
    } catch (error) {
        logger.error('Failed to delete prospect vendor', { error });
        return { error: 'Failed to delete prospect vendor' };
    }
}

/**
 * Full automated prospect pipeline:
 * Creates prospect → adds events → generates claim URL → sends pitch email.
 */
export async function autoProspectPipeline(input: {
    business_name: string;
    contact_email?: string;
    contact_phone?: string;
    instagram?: string;
    website?: string;
    bio?: string;
    logo_url?: string;
    location?: string;
    events: Array<{
        title: string;
        date: string;
        description?: string;
        image_url?: string;
        location_name?: string;
        city?: string;
        country?: string;
        event_type?: string;
        capacity?: number;
    }>;
    sendPitch: boolean;
    locale?: 'en' | 'ar';
}) {
    try {
        const { user } = await requireAdmin();
        const service = await getAdminService();
        const adminClient = await createAdminClient();

        // 1. Get system vendor
        const { data: systemVendor } = await adminClient
            .from('vendors')
            .select('id')
            .eq('slug', 'nuqta-platform')
            .single();

        if (!systemVendor) {
            return { error: 'System vendor account not found. Please create the Nuqta Platform vendor first.' };
        }

        // 2. Create prospect vendor
        const prospect = await service.createProspectVendor({
            business_name: input.business_name,
            contact_email: input.contact_email,
            contact_phone: input.contact_phone,
            instagram: input.instagram,
            website: input.website,
            bio: input.bio,
            logo_url: input.logo_url,
            location: input.location,
            notes: `[auto-pipeline] Created via Prospect Builder`,
        }, user.id);

        if (!prospect?.id) {
            return { error: 'Failed to create prospect vendor record' };
        }

        // 3. Create prospect events
        const eventIds: string[] = [];
        for (const eventData of input.events) {
            if (!eventData.title || !eventData.date) continue;
            try {
                const event = await service.createProspectEvent({
                    prospect_vendor_id: prospect.id,
                    ...eventData,
                }, systemVendor.id);
                if (event?.id) eventIds.push(event.id);
            } catch (eventErr) {
                logger.error('Failed to create prospect event in pipeline', { error: eventErr, prospectId: prospect.id });
            }
        }

        // 4. Generate claim token + URL
        const claimToken = await service.contactProspect(prospect.id, user.id);
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nuqta.ist';
        const locale = input.locale || 'ar';
        const claimUrl = `${baseUrl}/${locale}/claim/${claimToken}`;

        // 5. Send pitch email — check business hours first
        let emailSent = false;
        let emailScheduled = false;

        if (input.sendPitch && input.contact_email) {
            // Determine target timezone based on location/country
            const tz = guessTimezone(input.location);
            const isBusinessTime = isBusinessHours(tz);

            if (isBusinessTime) {
                try {
                    const { NotificationService } = await import('@/services/notification.service');
                    const notificationService = new NotificationService();
                    await notificationService.sendProspectFollowup({
                        email: input.contact_email,
                        businessName: input.business_name,
                        claimUrl,
                        interestCount: 0,
                        daysSincePitch: 0,
                        locale: input.locale || 'ar',
                    });
                    emailSent = true;
                } catch (emailErr) {
                    logger.error('Failed to send pitch email in pipeline', { error: emailErr, prospectId: prospect.id });
                }
            } else {
                // Outside business hours — mark for morning cron delivery
                const currentNotes = prospect.notes || '';
                await adminClient
                    .from('prospect_vendors')
                    .update({ notes: `${currentNotes}\n[pitch-pending]`.trim() })
                    .eq('id', prospect.id);
                emailScheduled = true;
                logger.info('Pitch email scheduled for morning delivery', { prospectId: prospect.id, tz });
            }
        }

        logger.info('Auto-prospect pipeline completed', {
            prospectId: prospect.id,
            eventsCreated: eventIds.length,
            emailSent,
            emailScheduled,
            claimUrl,
        });

        return {
            success: true,
            prospectId: prospect.id,
            claimUrl,
            claimToken,
            eventIds,
            emailSent,
            emailScheduled,
        };
    } catch (error) {
        logger.error('Auto-prospect pipeline failed', { error });
        return { error: 'Auto-prospect pipeline failed. Check logs for details.' };
    }
}

/**
 * Check if current time is within business hours (8AM-9PM) in a given timezone.
 */
function isBusinessHours(timezone: string): boolean {
    try {
        const now = new Date();
        const timeStr = now.toLocaleString('en-US', { timeZone: timezone, hour: 'numeric', hour12: false });
        const hour = parseInt(timeStr, 10);
        return hour >= 8 && hour < 21; // 8AM to 9PM
    } catch {
        return true; // If timezone lookup fails, send immediately
    }
}

/**
 * Guess the IANA timezone from a location string.
 */
function guessTimezone(location?: string): string {
    const loc = (location || '').toLowerCase();
    if (loc.includes('egypt') || loc.includes('cairo') || loc.includes('مصر') || loc.includes('القاهرة')) {
        return 'Africa/Cairo';
    }
    // Default to Istanbul for Turkey / unknown
    return 'Europe/Istanbul';
}

// ─── Activity Logs ──────────────────────────────────────────────────────────

export async function getAdminActivity(page = 1, pageSize = 50) {
    try {
        await requireAdmin();
        const service = await getAdminService();
        return await service.getRecentActivity(page, pageSize);
    } catch (error) {
        logger.error('Failed to get admin activity', { error });
        return null;
    }
}

// ─── Search Events (for feature tool) ───────────────────────────────────────

export async function searchEventsForAdmin(query: string) {
    try {
        await requireAdmin();
        const adminClient = await createAdminClient();

        const { data, error } = await adminClient
            .from('events')
            .select('id, title, slug, is_featured, status, vendor_id, vendors(business_name)')
            .or(`title.ilike.%${query}%,slug.ilike.%${query}%`)
            .eq('status', 'published')
            .limit(10);

        if (error) throw error;
        return data || [];
    } catch (error) {
        logger.error('Failed to search events', { error });
        return [];
    }
}

// ─── User Activity Tracking ─────────────────────────────────────────────────

export async function getAdminUserActivity(
    page = 1,
    pageSize = 20,
    filters?: { userId?: string; action?: string; userRole?: string }
) {
    try {
        await requireAdmin();
        const service = await getAdminService();
        return await service.getUserActivityFeed(page, pageSize, filters);
    } catch (error) {
        logger.error('Failed to get user activity feed', { error });
        return null;
    }
}

export async function getAdminUserEngagement() {
    try {
        await requireAdmin();
        const service = await getAdminService();
        return await service.getUserEngagementStats();
    } catch (error) {
        logger.error('Failed to get user engagement stats', { error });
        return null;
    }
}

export async function getAdminMostActiveUsers(limit = 10) {
    try {
        await requireAdmin();
        const service = await getAdminService();
        return await service.getMostActiveUsers(limit);
    } catch (error) {
        logger.error('Failed to get most active users', { error });
        return [];
    }
}

export async function scoutInstagramProfile(handle: string) {
    try {
        await requireAdmin();
        const username = handle.replace(/^@/, '').trim();
        if (!username) return { error: 'Invalid handle' };

        const fallback = {
            logoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=8b5cf6&color=fff&size=128`,
            website: `https://instagram.com/${username}`,
            businessName: username
        };

        // Strategy 1: Supabase Edge Function (runs on Deno Deploy IPs, not Vercel)
        // This avoids Instagram blocking Vercel's datacenter IPs
        try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (supabaseUrl && serviceKey) {
                const edgeRes = await fetch(
                    `${supabaseUrl}/functions/v1/scout-instagram`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${serviceKey}`,
                        },
                        body: JSON.stringify({ username }),
                    }
                );

                if (edgeRes.ok) {
                    const data = await edgeRes.json();
                    if (data?.success && data.logoUrl) {
                        return {
                            success: true,
                            logoUrl: data.logoUrl || fallback.logoUrl,
                            website: data.website || fallback.website,
                            businessName: data.businessName || username,
                            bio: data.bio || undefined,
                            location: data.location || undefined,
                            followers: data.followers ?? undefined,
                            following: data.following ?? undefined,
                            posts: data.posts ?? undefined,
                            isBusinessAccount: data.isBusinessAccount || false,
                            businessCategory: data.businessCategory || undefined,
                            isVerified: data.isVerified || false,
                            externalUrl: data.externalUrl || undefined,
                            contactPhone: data.contactPhone || undefined,
                            contactEmail: data.contactEmail || undefined,
                        };
                    }
                } else {
                    logger.warn('Edge function returned non-200', { status: edgeRes.status, handle });
                }
            }
        } catch (edgeErr) {
            logger.error('Edge function scout failed', { error: edgeErr, handle });
        }

        // Strategy 2: Instagram embed page (served even to datacenter IPs)
        // The embed HTML contains deeply-escaped JSON with profile_pic_url and full_name
        try {
            const embedRes = await fetch(`https://www.instagram.com/${username}/embed/`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                    'Accept': 'text/html',
                },
                cache: 'no-store',
            });

            if (embedRes.ok) {
                const html = await embedRes.text();

                // Use string operations (not regex) because the JSON is triple-escaped
                // Format in raw HTML: profile_pic_url\":\"https:\\/\\/...\"
                const extractEmbedValue = (text: string, key: string): string | null => {
                    const marker = key + '\\":\\"';
                    const start = text.indexOf(marker);
                    if (start === -1) return null;
                    const valueStart = start + marker.length;
                    const valueEnd = text.indexOf('\\"', valueStart);
                    if (valueEnd === -1) return null;
                    let value = text.substring(valueStart, valueEnd);
                    // Unescape: \\/ sequences to /
                    while (value.includes('\\/')) {
                        value = value.split('\\/').join('/');
                    }
                    return value;
                };

                const logoUrl = extractEmbedValue(html, 'profile_pic_url');
                const businessName = extractEmbedValue(html, 'full_name');
                const bio = extractEmbedValue(html, 'biography');

                if (logoUrl && logoUrl.startsWith('https://')) {
                    return {
                        success: true,
                        logoUrl,
                        website: `https://instagram.com/${username}`,
                        businessName: businessName?.trim() || username,
                        ...(bio ? { bio: bio.trim() } : {}),
                    };
                }
            }
        } catch (embedErr) {
            logger.error('Instagram embed fallback failed', { error: embedErr, handle });
        }

        // All strategies failed — return fallback with initials avatar
        return { success: true, ...fallback };
    } catch (error) {
        logger.error('Failed to scout Instagram profile', { error, handle });
        const cleanHandle = handle.replace(/^@/, '').trim();
        return {
            success: true,
            logoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanHandle)}&background=8b5cf6&color=fff&size=128`,
            website: `https://instagram.com/${cleanHandle}`,
            businessName: cleanHandle
        };
    }
}

