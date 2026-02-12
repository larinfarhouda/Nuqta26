import { AdminRepository } from '@/repositories/admin.repository';
import { logger } from '@/lib/logger/logger';
import type {
    VendorDirectoryParams,
    CreateProspectVendorInput,
    CreateProspectEventInput,
} from '@/types/admin.types';

/**
 * Admin Service
 * Business logic orchestration for the Super Admin panel.
 */
export class AdminService {
    constructor(private adminRepo: AdminRepository) { }

    // ─── Dashboard ──────────────────────────────────────────────────────

    async getDashboardData() {
        logger.info('AdminService: Fetching dashboard data');

        const [stats, subscription, trend, categories, eventStatus] = await Promise.all([
            this.adminRepo.getPlatformStats(),
            this.adminRepo.getSubscriptionRevenue(),
            this.adminRepo.get30DayTrend(),
            this.adminRepo.getTopCategories(),
            this.adminRepo.getEventStatusCounts(),
        ]);

        return { stats, subscription, trend, categories, eventStatus };
    }

    // ─── Vendor Management ──────────────────────────────────────────────

    async getVendorDirectory(params: VendorDirectoryParams) {
        logger.info('AdminService: Fetching vendor directory', { page: params.page });
        return this.adminRepo.getVendorDirectory(params);
    }

    async approveVendor(vendorId: string, adminId: string) {
        logger.info('AdminService: Approving vendor', { vendorId });
        await this.adminRepo.updateVendorStatus(vendorId, 'approved', true);
        await this.adminRepo.logActivity({
            user_id: adminId,
            action: 'vendor_approved',
            entity_type: 'vendor',
            entity_id: vendorId,
        });
    }

    async suspendVendor(vendorId: string, adminId: string) {
        logger.info('AdminService: Suspending vendor', { vendorId });
        await this.adminRepo.updateVendorStatus(vendorId, 'suspended', false);
        await this.adminRepo.logActivity({
            user_id: adminId,
            action: 'vendor_suspended',
            entity_type: 'vendor',
            entity_id: vendorId,
        });
    }

    // ─── Booking (Bank Transfer) Management ─────────────────────────────

    async getBankTransferQueue(page = 1, pageSize = 20) {
        logger.info('AdminService: Fetching bank transfer queue', { page });
        return this.adminRepo.getBankTransferQueue(page, pageSize);
    }

    async confirmPayment(bookingId: string, adminId: string) {
        logger.info('AdminService: Confirming payment', { bookingId });
        await this.adminRepo.confirmPayment(bookingId);
        await this.adminRepo.logActivity({
            user_id: adminId,
            action: 'payment_confirmed',
            entity_type: 'booking',
            entity_id: bookingId,
        });
    }

    async rejectPayment(bookingId: string, adminId: string) {
        logger.info('AdminService: Rejecting payment', { bookingId });
        await this.adminRepo.rejectPayment(bookingId);
        await this.adminRepo.logActivity({
            user_id: adminId,
            action: 'payment_rejected',
            entity_type: 'booking',
            entity_id: bookingId,
        });
    }

    // ─── Moderation ─────────────────────────────────────────────────────

    async getFlaggedReviews(page = 1, pageSize = 20) {
        logger.info('AdminService: Fetching flagged reviews', { page });
        return this.adminRepo.getFlaggedReviews(page, pageSize);
    }

    async unflagReview(reviewId: string) {
        logger.info('AdminService: Unflagging review', { reviewId });
        await this.adminRepo.unflagReview(reviewId);
    }

    async deleteReview(reviewId: string) {
        logger.info('AdminService: Deleting review', { reviewId });
        await this.adminRepo.deleteReview(reviewId);
    }

    async toggleFeatureEvent(eventId: string, featured: boolean, adminId: string) {
        logger.info('AdminService: Toggling event feature', { eventId, featured });
        await this.adminRepo.toggleFeatureEvent(eventId, featured);
        if (featured) {
            await this.adminRepo.logActivity({
                user_id: adminId,
                action: 'event_featured',
                entity_type: 'event',
                entity_id: eventId,
            });
        }
    }

    // ─── Prospect Vendors (Phantom Listings) ────────────────────────────

    async createProspectVendor(input: CreateProspectVendorInput, adminId: string) {
        logger.info('AdminService: Creating prospect vendor', { businessName: input.business_name });
        const prospect = await this.adminRepo.createProspectVendor(input, adminId);
        await this.adminRepo.logActivity({
            user_id: adminId,
            action: 'prospect_created',
            entity_type: 'prospect_vendor',
            entity_id: prospect.id,
            metadata: { business_name: input.business_name },
        });
        return prospect;
    }

    async getProspects(page = 1, pageSize = 20, status?: string) {
        logger.info('AdminService: Fetching prospects', { page, status });
        return this.adminRepo.getProspects(page, pageSize, status);
    }

    async contactProspect(prospectId: string, adminId: string) {
        logger.info('AdminService: Marking prospect as contacted', { prospectId });
        await this.adminRepo.updateProspectStatus(prospectId, 'contacted');
        const token = await this.adminRepo.generateClaimToken(prospectId);
        await this.adminRepo.logActivity({
            user_id: adminId,
            action: 'prospect_contacted',
            entity_type: 'prospect_vendor',
            entity_id: prospectId,
        });
        return token;
    }

    async createProspectEvent(input: CreateProspectEventInput, systemVendorId: string) {
        logger.info('AdminService: Creating prospect event', { prospect: input.prospect_vendor_id });
        return this.adminRepo.createProspectEvent(input, systemVendorId);
    }

    async getProspectInterests(prospectId: string) {
        logger.info('AdminService: Fetching prospect interests', { prospectId });
        return this.adminRepo.getProspectInterests(prospectId);
    }

    async convertProspect(prospectId: string, vendorId: string, systemVendorId: string, adminId: string) {
        logger.info('AdminService: Converting prospect to vendor', { prospectId, vendorId });
        await this.adminRepo.convertProspect(prospectId, vendorId, systemVendorId);
        await this.adminRepo.logActivity({
            user_id: adminId,
            action: 'prospect_converted',
            entity_type: 'prospect_vendor',
            entity_id: prospectId,
            metadata: { converted_vendor_id: vendorId },
        });
    }

    // ─── Activity Logs ──────────────────────────────────────────────────

    async getRecentActivity(page = 1, pageSize = 50) {
        logger.info('AdminService: Fetching recent activity', { page });
        return this.adminRepo.getRecentActivity(page, pageSize);
    }

    async logActivity(input: Parameters<AdminRepository['logActivity']>[0]) {
        return this.adminRepo.logActivity(input);
    }
}
