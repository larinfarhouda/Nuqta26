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

function getAdminService() {
    const adminClient = createAdminClient();
    const factory = new ServiceFactory(adminClient);
    return factory.getAdminService();
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export async function getAdminDashboardData() {
    try {
        await requireAdmin();
        const service = getAdminService();
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
        const service = getAdminService();
        return await service.getVendorDirectory({ page, pageSize, search, tier });
    } catch (error) {
        logger.error('Failed to get admin vendors', { error });
        return null;
    }
}

export async function approveVendor(vendorId: string) {
    try {
        const { user } = await requireAdmin();
        const service = getAdminService();
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
        const service = getAdminService();
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
            Promise.resolve(getAdminService()),
        ]);
        return await service.getVendorFullDetails(vendorId);
    } catch (error) {
        logger.error('Failed to get vendor full details', { error });
        return null;
    }
}

export async function updateVendorSubscription(vendorId: string, tier: string, isFounder: boolean) {
    try {
        const { user } = await requireAdmin();
        const service = getAdminService();
        await service.updateVendorSubscription(vendorId, tier, isFounder, user.id);
        return { success: true };
    } catch (error) {
        logger.error('Failed to update vendor subscription', { error });
        return { error: 'Failed to update subscription' };
    }
}

export async function updateVendorDetails(vendorId: string, updates: Record<string, any>) {
    try {
        const { user } = await requireAdmin();
        const service = getAdminService();
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
        const adminClient = createAdminClient();

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
        const service = getAdminService();
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

        return { success: true, url: actionLink };
    } catch (error) {
        logger.error('Failed to impersonate vendor', { error });
        return { error: 'Failed to impersonate vendor' };
    }
}

// ─── Booking (Bank Transfer) Management ─────────────────────────────────────

export async function getAdminBankTransfers(page = 1, pageSize = 20) {
    try {
        await requireAdmin();
        const service = getAdminService();
        return await service.getBankTransferQueue(page, pageSize);
    } catch (error) {
        logger.error('Failed to get bank transfers', { error });
        return null;
    }
}

export async function confirmBankPayment(bookingId: string) {
    try {
        const { user } = await requireAdmin();
        const service = getAdminService();
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
        const service = getAdminService();
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
        const service = getAdminService();
        return await service.getFlaggedReviews(page, pageSize);
    } catch (error) {
        logger.error('Failed to get flagged reviews', { error });
        return null;
    }
}

export async function unflagReview(reviewId: string) {
    try {
        await requireAdmin();
        const service = getAdminService();
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
        const service = getAdminService();
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
        const service = getAdminService();
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
}) {
    try {
        const { user } = await requireAdmin();
        const service = getAdminService();
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
        const service = getAdminService();
        return await service.getProspects(page, pageSize, status);
    } catch (error) {
        logger.error('Failed to get prospects', { error });
        return null;
    }
}

export async function contactProspect(prospectId: string) {
    try {
        const { user } = await requireAdmin();
        const service = getAdminService();
        const claimToken = await service.contactProspect(prospectId, user.id);
        const claimUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nuqta.events'}/claim/${claimToken}`;
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
        const service = getAdminService();

        // Get system vendor ID
        const adminClient = createAdminClient();
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
        const service = getAdminService();
        return await service.getProspectInterests(prospectId);
    } catch (error) {
        logger.error('Failed to get prospect interests', { error });
        return [];
    }
}

// ─── Activity Logs ──────────────────────────────────────────────────────────

export async function getAdminActivity(page = 1, pageSize = 50) {
    try {
        await requireAdmin();
        const service = getAdminService();
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
        const adminClient = createAdminClient();

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
        const service = getAdminService();
        return await service.getUserActivityFeed(page, pageSize, filters);
    } catch (error) {
        logger.error('Failed to get user activity feed', { error });
        return null;
    }
}

export async function getAdminUserEngagement() {
    try {
        await requireAdmin();
        const service = getAdminService();
        return await service.getUserEngagementStats();
    } catch (error) {
        logger.error('Failed to get user engagement stats', { error });
        return null;
    }
}

export async function getAdminMostActiveUsers(limit = 10) {
    try {
        await requireAdmin();
        const service = getAdminService();
        return await service.getMostActiveUsers(limit);
    } catch (error) {
        logger.error('Failed to get most active users', { error });
        return [];
    }
}
