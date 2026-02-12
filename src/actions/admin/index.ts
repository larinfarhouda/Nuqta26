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
