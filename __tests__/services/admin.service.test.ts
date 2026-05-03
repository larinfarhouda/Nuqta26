/**
 * AdminService Tests
 * Tests for super admin panel business logic
 */

import { AdminService } from '@/services/admin.service';
import { AdminDashboardRepository } from '@/repositories/admin/dashboard.repository';
import { AdminVendorRepository } from '@/repositories/admin/vendor-management.repository';
import { AdminPaymentRepository } from '@/repositories/admin/payment.repository';
import { AdminModerationRepository } from '@/repositories/admin/moderation.repository';
import { AdminProspectRepository } from '@/repositories/admin/prospect.repository';
import { AdminActivityRepository } from '@/repositories/admin/activity.repository';

describe('AdminService', () => {
    let adminService: AdminService;
    let mockDashboardRepo: jest.Mocked<AdminDashboardRepository>;
    let mockVendorRepo: jest.Mocked<AdminVendorRepository>;
    let mockPaymentRepo: jest.Mocked<AdminPaymentRepository>;
    let mockModerationRepo: jest.Mocked<AdminModerationRepository>;
    let mockProspectRepo: jest.Mocked<AdminProspectRepository>;
    let mockActivityRepo: jest.Mocked<AdminActivityRepository>;

    beforeEach(() => {
        mockDashboardRepo = {
            getPlatformStats: jest.fn(),
            getSubscriptionRevenue: jest.fn(),
            get30DayTrend: jest.fn(),
            getTopCategories: jest.fn(),
            getEventStatusCounts: jest.fn(),
        } as any;

        mockVendorRepo = {
            getVendorDirectory: jest.fn(),
            updateVendorStatus: jest.fn(),
            getVendorFullDetails: jest.fn(),
            updateVendorSubscription: jest.fn(),
            updateVendorDetails: jest.fn(),
        } as any;

        mockPaymentRepo = {
            getBankTransferQueue: jest.fn(),
            confirmPayment: jest.fn(),
            rejectPayment: jest.fn(),
        } as any;

        mockModerationRepo = {
            getFlaggedReviews: jest.fn(),
            unflagReview: jest.fn(),
            deleteReview: jest.fn(),
            toggleFeatureEvent: jest.fn(),
        } as any;

        mockProspectRepo = {
            createProspectVendor: jest.fn(),
            getProspects: jest.fn(),
            updateProspectStatus: jest.fn(),
            generateClaimToken: jest.fn(),
            createProspectEvent: jest.fn(),
            getProspectInterests: jest.fn(),
            convertProspect: jest.fn(),
        } as any;

        mockActivityRepo = {
            logActivity: jest.fn(),
            getRecentActivity: jest.fn(),
            getUserActivityFeed: jest.fn(),
            getUserEngagementStats: jest.fn(),
            getMostActiveUsers: jest.fn(),
        } as any;

        adminService = new AdminService(
            mockDashboardRepo,
            mockVendorRepo,
            mockPaymentRepo,
            mockModerationRepo,
            mockProspectRepo,
            mockActivityRepo,
        );
    });


    afterEach(() => {
        jest.clearAllMocks();
    });

    // ─── Dashboard ──────────────────────────────────────────────────────

    describe('getDashboardData', () => {
        it('should aggregate all dashboard data in parallel', async () => {
            const stats = { totalVendors: 10, totalEvents: 50 };
            const subscription = { mrr: 1000 };
            const trend = [{ date: '2026-01-15', count: 5 }];
            const categories = [{ name: 'Music', count: 20 }];
            const eventStatus = { published: 30, draft: 20 };

            mockDashboardRepo.getPlatformStats.mockResolvedValue(stats);
            mockDashboardRepo.getSubscriptionRevenue.mockResolvedValue(subscription);
            mockDashboardRepo.get30DayTrend.mockResolvedValue(trend);
            mockDashboardRepo.getTopCategories.mockResolvedValue(categories);
            mockDashboardRepo.getEventStatusCounts.mockResolvedValue(eventStatus);

            const result = await adminService.getDashboardData();

            expect(result.stats).toEqual(stats);
            expect(result.subscription).toEqual(subscription);
            expect(result.trend).toEqual(trend);
            expect(result.categories).toEqual(categories);
            expect(result.eventStatus).toEqual(eventStatus);
        });
    });

    // ─── Vendor Management ──────────────────────────────────────────────

    describe('getVendorDirectory', () => {
        it('should pass params to repository', async () => {
            const params = { page: 1, pageSize: 20, search: 'test' };
            const expected = { data: [], total: 0 };
            mockVendorRepo.getVendorDirectory.mockResolvedValue(expected);

            const result = await adminService.getVendorDirectory(params as any);

            expect(result).toEqual(expected);
            expect(mockVendorRepo.getVendorDirectory).toHaveBeenCalledWith(params);
        });
    });

    describe('approveVendor', () => {
        it('should update status and log activity', async () => {
            await adminService.approveVendor('vendor-123', 'admin-1');

            expect(mockVendorRepo.updateVendorStatus).toHaveBeenCalledWith('vendor-123', 'approved', true);
            expect(mockActivityRepo.logActivity).toHaveBeenCalledWith(
                expect.objectContaining({
                    user_id: 'admin-1',
                    action: 'vendor_approved',
                    entity_type: 'vendor',
                    entity_id: 'vendor-123',
                })
            );
        });
    });

    describe('suspendVendor', () => {
        it('should update status and log activity', async () => {
            await adminService.suspendVendor('vendor-123', 'admin-1');

            expect(mockVendorRepo.updateVendorStatus).toHaveBeenCalledWith('vendor-123', 'suspended', false);
            expect(mockActivityRepo.logActivity).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'vendor_suspended',
                    entity_id: 'vendor-123',
                })
            );
        });
    });

    // ─── Booking (Bank Transfer) Management ─────────────────────────────

    describe('getBankTransferQueue', () => {
        it('should use default pagination', async () => {
            mockPaymentRepo.getBankTransferQueue.mockResolvedValue({ data: [], total: 0 });

            await adminService.getBankTransferQueue();

            expect(mockPaymentRepo.getBankTransferQueue).toHaveBeenCalledWith(1, 20);
        });

        it('should pass custom pagination', async () => {
            mockPaymentRepo.getBankTransferQueue.mockResolvedValue({ data: [], total: 0 });

            await adminService.getBankTransferQueue(3, 50);

            expect(mockPaymentRepo.getBankTransferQueue).toHaveBeenCalledWith(3, 50);
        });
    });

    describe('confirmPayment', () => {
        it('should confirm payment and log activity', async () => {
            await adminService.confirmPayment('booking-123', 'admin-1');

            expect(mockPaymentRepo.confirmPayment).toHaveBeenCalledWith('booking-123');
            expect(mockActivityRepo.logActivity).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'payment_confirmed',
                    entity_type: 'booking',
                    entity_id: 'booking-123',
                })
            );
        });
    });

    describe('rejectPayment', () => {
        it('should reject payment and log activity', async () => {
            await adminService.rejectPayment('booking-123', 'admin-1');

            expect(mockPaymentRepo.rejectPayment).toHaveBeenCalledWith('booking-123');
            expect(mockActivityRepo.logActivity).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'payment_rejected',
                    entity_type: 'booking',
                    entity_id: 'booking-123',
                })
            );
        });
    });

    // ─── Moderation ─────────────────────────────────────────────────────

    describe('getFlaggedReviews', () => {
        it('should use default pagination', async () => {
            mockModerationRepo.getFlaggedReviews.mockResolvedValue({ data: [], total: 0 });

            await adminService.getFlaggedReviews();

            expect(mockModerationRepo.getFlaggedReviews).toHaveBeenCalledWith(1, 20);
        });
    });

    describe('unflagReview', () => {
        it('should call repo unflagReview', async () => {
            await adminService.unflagReview('review-123');

            expect(mockModerationRepo.unflagReview).toHaveBeenCalledWith('review-123');
        });
    });

    describe('deleteReview', () => {
        it('should call repo deleteReview', async () => {
            await adminService.deleteReview('review-123');

            expect(mockModerationRepo.deleteReview).toHaveBeenCalledWith('review-123');
        });
    });

    describe('toggleFeatureEvent', () => {
        it('should toggle feature and log activity when featuring', async () => {
            await adminService.toggleFeatureEvent('event-123', true, 'admin-1');

            expect(mockModerationRepo.toggleFeatureEvent).toHaveBeenCalledWith('event-123', true);
            expect(mockActivityRepo.logActivity).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'event_featured',
                    entity_id: 'event-123',
                })
            );
        });

        it('should toggle feature but NOT log activity when unfeaturing', async () => {
            await adminService.toggleFeatureEvent('event-123', false, 'admin-1');

            expect(mockModerationRepo.toggleFeatureEvent).toHaveBeenCalledWith('event-123', false);
            expect(mockActivityRepo.logActivity).not.toHaveBeenCalled();
        });
    });

    // ─── Prospect Vendors ───────────────────────────────────────────────

    describe('createProspectVendor', () => {
        it('should create prospect and log activity', async () => {
            const input = { business_name: 'New Vendor' } as any;
            mockProspectRepo.createProspectVendor.mockResolvedValue({ id: 'prospect-1', ...input });

            const result = await adminService.createProspectVendor(input, 'admin-1');

            expect(result.id).toBe('prospect-1');
            expect(mockProspectRepo.createProspectVendor).toHaveBeenCalledWith(input, 'admin-1');
            expect(mockActivityRepo.logActivity).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'prospect_created',
                    entity_type: 'prospect_vendor',
                    entity_id: 'prospect-1',
                })
            );
        });
    });

    describe('getProspects', () => {
        it('should pass pagination and status', async () => {
            mockProspectRepo.getProspects.mockResolvedValue({ data: [], total: 0 });

            await adminService.getProspects(2, 10, 'active');

            expect(mockProspectRepo.getProspects).toHaveBeenCalledWith(2, 10, 'active');
        });
    });

    describe('contactProspect', () => {
        it('should update status, generate token, and log activity', async () => {
            mockProspectRepo.generateClaimToken.mockResolvedValue('token-abc');

            const token = await adminService.contactProspect('prospect-1', 'admin-1');

            expect(token).toBe('token-abc');
            expect(mockProspectRepo.updateProspectStatus).toHaveBeenCalledWith('prospect-1', 'contacted');
            expect(mockProspectRepo.generateClaimToken).toHaveBeenCalledWith('prospect-1');
            expect(mockActivityRepo.logActivity).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'prospect_contacted',
                    entity_id: 'prospect-1',
                })
            );
        });
    });

    describe('createProspectEvent', () => {
        it('should delegate to repository', async () => {
            const input = { prospect_vendor_id: 'prospect-1', title: 'Event' } as any;
            mockProspectRepo.createProspectEvent.mockResolvedValue({ id: 'event-1' });

            const result = await adminService.createProspectEvent(input, 'sys-vendor-1');

            expect(mockProspectRepo.createProspectEvent).toHaveBeenCalledWith(input, 'sys-vendor-1');
            expect(result.id).toBe('event-1');
        });
    });

    describe('convertProspect', () => {
        it('should convert prospect and log activity with metadata', async () => {
            await adminService.convertProspect('prospect-1', 'vendor-1', 'sys-vendor', 'admin-1');

            expect(mockProspectRepo.convertProspect).toHaveBeenCalledWith('prospect-1', 'vendor-1', 'sys-vendor');
            expect(mockActivityRepo.logActivity).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'prospect_converted',
                    entity_id: 'prospect-1',
                    metadata: { converted_vendor_id: 'vendor-1' },
                })
            );
        });
    });

    // ─── Activity Logs ──────────────────────────────────────────────────

    describe('getRecentActivity', () => {
        it('should use default pagination', async () => {
            mockActivityRepo.getRecentActivity.mockResolvedValue({ data: [], total: 0 });

            await adminService.getRecentActivity();

            expect(mockActivityRepo.getRecentActivity).toHaveBeenCalledWith(1, 50);
        });
    });

    describe('logActivity', () => {
        it('should delegate to repository', async () => {
            const input = { user_id: 'admin-1', action: 'test', entity_type: 'test', entity_id: '1' } as any;

            await adminService.logActivity(input);

            expect(mockActivityRepo.logActivity).toHaveBeenCalledWith(input);
        });
    });
});
