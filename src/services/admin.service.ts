import { AdminDashboardRepository } from '@/repositories/admin/dashboard.repository';
import { AdminVendorRepository } from '@/repositories/admin/vendor-management.repository';
import { AdminPaymentRepository } from '@/repositories/admin/payment.repository';
import { AdminModerationRepository } from '@/repositories/admin/moderation.repository';
import { AdminProspectRepository } from '@/repositories/admin/prospect.repository';
import { AdminActivityRepository } from '@/repositories/admin/activity.repository';
import { logger } from '@/lib/logger/logger';
import type {
    VendorDirectoryParams,
    CreateProspectVendorInput,
    CreateProspectEventInput,
} from '@/types/admin.types';

/**
 * Admin Service
 * Business logic orchestration for the Super Admin panel.
 * Delegates to focused repositories for each domain area.
 */
export class AdminService {
    constructor(
        private dashboardRepo: AdminDashboardRepository,
        private vendorRepo: AdminVendorRepository,
        private paymentRepo: AdminPaymentRepository,
        private moderationRepo: AdminModerationRepository,
        private prospectRepo: AdminProspectRepository,
        private activityRepo: AdminActivityRepository,
    ) { }

    // ─── Dashboard ──────────────────────────────────────────────────────

    async getDashboardData() {
        logger.info('AdminService: Fetching dashboard data');

        const [stats, subscription, trend, categories, eventStatus] = await Promise.all([
            this.dashboardRepo.getPlatformStats(),
            this.dashboardRepo.getSubscriptionRevenue(),
            this.dashboardRepo.get30DayTrend(),
            this.dashboardRepo.getTopCategories(),
            this.dashboardRepo.getEventStatusCounts(),
        ]);

        return { stats, subscription, trend, categories, eventStatus };
    }

    // ─── Vendor Management ──────────────────────────────────────────────

    async getVendorDirectory(params: VendorDirectoryParams) {
        logger.info('AdminService: Fetching vendor directory', { page: params.page });
        return this.vendorRepo.getVendorDirectory(params);
    }

    async approveVendor(vendorId: string, adminId: string) {
        logger.info('AdminService: Approving vendor', { vendorId });
        await this.vendorRepo.updateVendorStatus(vendorId, 'approved', true);
        await this.activityRepo.logActivity({
            user_id: adminId,
            action: 'vendor_approved',
            entity_type: 'vendor',
            entity_id: vendorId,
        });
    }

    async suspendVendor(vendorId: string, adminId: string) {
        logger.info('AdminService: Suspending vendor', { vendorId });
        await this.vendorRepo.updateVendorStatus(vendorId, 'suspended', false);
        await this.activityRepo.logActivity({
            user_id: adminId,
            action: 'vendor_suspended',
            entity_type: 'vendor',
            entity_id: vendorId,
        });
    }

    async getVendorFullDetails(vendorId: string) {
        logger.info('AdminService: Fetching vendor full details', { vendorId });
        return this.vendorRepo.getVendorFullDetails(vendorId);
    }

    async updateVendorSubscription(vendorId: string, tier: string, billingPeriod: string, adminId: string) {
        logger.info('AdminService: Updating vendor subscription', { vendorId, tier, billingPeriod });
        await this.vendorRepo.updateVendorSubscription(vendorId, tier, billingPeriod);
        await this.activityRepo.logActivity({
            user_id: adminId,
            action: 'subscription_changed',
            entity_type: 'vendor',
            entity_id: vendorId,
            metadata: { tier, billing_period: billingPeriod },
        });
    }

    async updateVendorDetails(vendorId: string, updates: Record<string, any>, adminId: string) {
        logger.info('AdminService: Updating vendor details', { vendorId });
        await this.vendorRepo.updateVendorDetails(vendorId, updates);
        await this.activityRepo.logActivity({
            user_id: adminId,
            action: 'vendor_updated',
            entity_type: 'vendor',
            entity_id: vendorId,
            metadata: { fields: Object.keys(updates) },
        });
    }

    // ─── Booking (Bank Transfer) Management ─────────────────────────────

    async getBankTransferQueue(page = 1, pageSize = 20) {
        logger.info('AdminService: Fetching bank transfer queue', { page });
        return this.paymentRepo.getBankTransferQueue(page, pageSize);
    }

    async confirmPayment(bookingId: string, adminId: string) {
        logger.info('AdminService: Confirming payment', { bookingId });
        await this.paymentRepo.confirmPayment(bookingId);
        await this.activityRepo.logActivity({
            user_id: adminId,
            action: 'payment_confirmed',
            entity_type: 'booking',
            entity_id: bookingId,
        });
    }

    async rejectPayment(bookingId: string, adminId: string) {
        logger.info('AdminService: Rejecting payment', { bookingId });
        await this.paymentRepo.rejectPayment(bookingId);
        await this.activityRepo.logActivity({
            user_id: adminId,
            action: 'payment_rejected',
            entity_type: 'booking',
            entity_id: bookingId,
        });
    }

    // ─── Moderation ─────────────────────────────────────────────────────

    async getFlaggedReviews(page = 1, pageSize = 20) {
        logger.info('AdminService: Fetching flagged reviews', { page });
        return this.moderationRepo.getFlaggedReviews(page, pageSize);
    }

    async unflagReview(reviewId: string) {
        logger.info('AdminService: Unflagging review', { reviewId });
        await this.moderationRepo.unflagReview(reviewId);
    }

    async deleteReview(reviewId: string) {
        logger.info('AdminService: Deleting review', { reviewId });
        await this.moderationRepo.deleteReview(reviewId);
    }

    async toggleFeatureEvent(eventId: string, featured: boolean, adminId: string) {
        logger.info('AdminService: Toggling event feature', { eventId, featured });
        await this.moderationRepo.toggleFeatureEvent(eventId, featured);
        if (featured) {
            await this.activityRepo.logActivity({
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
        const prospect = await this.prospectRepo.createProspectVendor(input, adminId);
        await this.activityRepo.logActivity({
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
        return this.prospectRepo.getProspects(page, pageSize, status);
    }

    async contactProspect(prospectId: string, adminId: string) {
        logger.info('AdminService: Marking prospect as contacted', { prospectId });
        await this.prospectRepo.updateProspectStatus(prospectId, 'contacted');
        const token = await this.prospectRepo.generateClaimToken(prospectId);
        await this.activityRepo.logActivity({
            user_id: adminId,
            action: 'prospect_contacted',
            entity_type: 'prospect_vendor',
            entity_id: prospectId,
        });
        return token;
    }

    async createProspectEvent(input: CreateProspectEventInput, systemVendorId: string) {
        logger.info('AdminService: Creating prospect event', { prospect: input.prospect_vendor_id });
        return this.prospectRepo.createProspectEvent(input, systemVendorId);
    }

    async getProspectInterests(prospectId: string) {
        logger.info('AdminService: Fetching prospect interests', { prospectId });
        return this.prospectRepo.getProspectInterests(prospectId);
    }

    async convertProspect(prospectId: string, vendorId: string, systemVendorId: string, adminId: string) {
        logger.info('AdminService: Converting prospect to vendor', { prospectId, vendorId });
        await this.prospectRepo.convertProspect(prospectId, vendorId, systemVendorId);
        await this.activityRepo.logActivity({
            user_id: adminId,
            action: 'prospect_converted',
            entity_type: 'prospect_vendor',
            entity_id: prospectId,
            metadata: { converted_vendor_id: vendorId },
        });
    }

    async updateProspectVendor(prospectId: string, input: Partial<CreateProspectVendorInput>, adminId: string) {
        logger.info('AdminService: Updating prospect vendor', { prospectId });
        await this.prospectRepo.updateProspectVendor(prospectId, input);
        await this.activityRepo.logActivity({
            user_id: adminId,
            action: 'prospect_updated',
            entity_type: 'prospect_vendor',
            entity_id: prospectId,
            metadata: { fields: Object.keys(input) },
        });
    }

    async deleteProspectVendor(prospectId: string, adminId: string) {
        logger.info('AdminService: Deleting prospect vendor', { prospectId });
        await this.prospectRepo.deleteProspectVendor(prospectId);
        await this.activityRepo.logActivity({
            user_id: adminId,
            action: 'prospect_deleted',
            entity_type: 'prospect_vendor',
            entity_id: prospectId,
        });
    }

    // ─── Activity Logs ──────────────────────────────────────────────────

    async getRecentActivity(page = 1, pageSize = 50) {
        logger.info('AdminService: Fetching recent activity', { page });
        return this.activityRepo.getRecentActivity(page, pageSize);
    }

    async logActivity(input: Parameters<AdminActivityRepository['logActivity']>[0]) {
        return this.activityRepo.logActivity(input);
    }

    // ─── User Activity Tracking ─────────────────────────────────────────

    async getUserActivityFeed(
        page: number,
        pageSize: number,
        filters?: { userId?: string; action?: string; userRole?: string }
    ) {
        logger.info('AdminService: Fetching user activity feed', { page });
        return this.activityRepo.getUserActivityFeed(page, pageSize, filters);
    }

    async getUserEngagementStats() {
        logger.info('AdminService: Fetching user engagement stats');
        return this.activityRepo.getUserEngagementStats();
    }

    async getMostActiveUsers(limit = 10) {
        logger.info('AdminService: Fetching most active users', { limit });
        return this.activityRepo.getMostActiveUsers(limit);
    }
}
