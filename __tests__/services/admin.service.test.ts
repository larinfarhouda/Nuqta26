/**
 * AdminService Tests
 * Tests for super admin panel business logic
 */

import { AdminService } from '@/services/admin.service';
import { AdminRepository } from '@/repositories/admin.repository';

describe('AdminService', () => {
    let adminService: AdminService;
    let mockAdminRepo: jest.Mocked<AdminRepository>;

    beforeEach(() => {
        mockAdminRepo = {
            getPlatformStats: jest.fn(),
            getSubscriptionRevenue: jest.fn(),
            get30DayTrend: jest.fn(),
            getTopCategories: jest.fn(),
            getEventStatusCounts: jest.fn(),
            getVendorDirectory: jest.fn(),
            updateVendorStatus: jest.fn(),
            logActivity: jest.fn(),
            getBankTransferQueue: jest.fn(),
            confirmPayment: jest.fn(),
            rejectPayment: jest.fn(),
            getFlaggedReviews: jest.fn(),
            unflagReview: jest.fn(),
            deleteReview: jest.fn(),
            toggleFeatureEvent: jest.fn(),
            createProspectVendor: jest.fn(),
            getProspects: jest.fn(),
            updateProspectStatus: jest.fn(),
            generateClaimToken: jest.fn(),
            createProspectEvent: jest.fn(),
            getProspectInterests: jest.fn(),
            convertProspect: jest.fn(),
            getRecentActivity: jest.fn(),
        } as any;

        adminService = new AdminService(mockAdminRepo);
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

            mockAdminRepo.getPlatformStats.mockResolvedValue(stats);
            mockAdminRepo.getSubscriptionRevenue.mockResolvedValue(subscription);
            mockAdminRepo.get30DayTrend.mockResolvedValue(trend);
            mockAdminRepo.getTopCategories.mockResolvedValue(categories);
            mockAdminRepo.getEventStatusCounts.mockResolvedValue(eventStatus);

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
            mockAdminRepo.getVendorDirectory.mockResolvedValue(expected);

            const result = await adminService.getVendorDirectory(params as any);

            expect(result).toEqual(expected);
            expect(mockAdminRepo.getVendorDirectory).toHaveBeenCalledWith(params);
        });
    });

    describe('approveVendor', () => {
        it('should update status and log activity', async () => {
            await adminService.approveVendor('vendor-123', 'admin-1');

            expect(mockAdminRepo.updateVendorStatus).toHaveBeenCalledWith('vendor-123', 'approved', true);
            expect(mockAdminRepo.logActivity).toHaveBeenCalledWith(
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

            expect(mockAdminRepo.updateVendorStatus).toHaveBeenCalledWith('vendor-123', 'suspended', false);
            expect(mockAdminRepo.logActivity).toHaveBeenCalledWith(
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
            mockAdminRepo.getBankTransferQueue.mockResolvedValue({ data: [], total: 0 });

            await adminService.getBankTransferQueue();

            expect(mockAdminRepo.getBankTransferQueue).toHaveBeenCalledWith(1, 20);
        });

        it('should pass custom pagination', async () => {
            mockAdminRepo.getBankTransferQueue.mockResolvedValue({ data: [], total: 0 });

            await adminService.getBankTransferQueue(3, 50);

            expect(mockAdminRepo.getBankTransferQueue).toHaveBeenCalledWith(3, 50);
        });
    });

    describe('confirmPayment', () => {
        it('should confirm payment and log activity', async () => {
            await adminService.confirmPayment('booking-123', 'admin-1');

            expect(mockAdminRepo.confirmPayment).toHaveBeenCalledWith('booking-123');
            expect(mockAdminRepo.logActivity).toHaveBeenCalledWith(
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

            expect(mockAdminRepo.rejectPayment).toHaveBeenCalledWith('booking-123');
            expect(mockAdminRepo.logActivity).toHaveBeenCalledWith(
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
            mockAdminRepo.getFlaggedReviews.mockResolvedValue({ data: [], total: 0 });

            await adminService.getFlaggedReviews();

            expect(mockAdminRepo.getFlaggedReviews).toHaveBeenCalledWith(1, 20);
        });
    });

    describe('unflagReview', () => {
        it('should call repo unflagReview', async () => {
            await adminService.unflagReview('review-123');

            expect(mockAdminRepo.unflagReview).toHaveBeenCalledWith('review-123');
        });
    });

    describe('deleteReview', () => {
        it('should call repo deleteReview', async () => {
            await adminService.deleteReview('review-123');

            expect(mockAdminRepo.deleteReview).toHaveBeenCalledWith('review-123');
        });
    });

    describe('toggleFeatureEvent', () => {
        it('should toggle feature and log activity when featuring', async () => {
            await adminService.toggleFeatureEvent('event-123', true, 'admin-1');

            expect(mockAdminRepo.toggleFeatureEvent).toHaveBeenCalledWith('event-123', true);
            expect(mockAdminRepo.logActivity).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'event_featured',
                    entity_id: 'event-123',
                })
            );
        });

        it('should toggle feature but NOT log activity when unfeaturing', async () => {
            await adminService.toggleFeatureEvent('event-123', false, 'admin-1');

            expect(mockAdminRepo.toggleFeatureEvent).toHaveBeenCalledWith('event-123', false);
            expect(mockAdminRepo.logActivity).not.toHaveBeenCalled();
        });
    });

    // ─── Prospect Vendors ───────────────────────────────────────────────

    describe('createProspectVendor', () => {
        it('should create prospect and log activity', async () => {
            const input = { business_name: 'New Vendor' } as any;
            mockAdminRepo.createProspectVendor.mockResolvedValue({ id: 'prospect-1', ...input });

            const result = await adminService.createProspectVendor(input, 'admin-1');

            expect(result.id).toBe('prospect-1');
            expect(mockAdminRepo.createProspectVendor).toHaveBeenCalledWith(input, 'admin-1');
            expect(mockAdminRepo.logActivity).toHaveBeenCalledWith(
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
            mockAdminRepo.getProspects.mockResolvedValue({ data: [], total: 0 });

            await adminService.getProspects(2, 10, 'active');

            expect(mockAdminRepo.getProspects).toHaveBeenCalledWith(2, 10, 'active');
        });
    });

    describe('contactProspect', () => {
        it('should update status, generate token, and log activity', async () => {
            mockAdminRepo.generateClaimToken.mockResolvedValue('token-abc');

            const token = await adminService.contactProspect('prospect-1', 'admin-1');

            expect(token).toBe('token-abc');
            expect(mockAdminRepo.updateProspectStatus).toHaveBeenCalledWith('prospect-1', 'contacted');
            expect(mockAdminRepo.generateClaimToken).toHaveBeenCalledWith('prospect-1');
            expect(mockAdminRepo.logActivity).toHaveBeenCalledWith(
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
            mockAdminRepo.createProspectEvent.mockResolvedValue({ id: 'event-1' });

            const result = await adminService.createProspectEvent(input, 'sys-vendor-1');

            expect(mockAdminRepo.createProspectEvent).toHaveBeenCalledWith(input, 'sys-vendor-1');
            expect(result.id).toBe('event-1');
        });
    });

    describe('convertProspect', () => {
        it('should convert prospect and log activity with metadata', async () => {
            await adminService.convertProspect('prospect-1', 'vendor-1', 'sys-vendor', 'admin-1');

            expect(mockAdminRepo.convertProspect).toHaveBeenCalledWith('prospect-1', 'vendor-1', 'sys-vendor');
            expect(mockAdminRepo.logActivity).toHaveBeenCalledWith(
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
            mockAdminRepo.getRecentActivity.mockResolvedValue({ data: [], total: 0 });

            await adminService.getRecentActivity();

            expect(mockAdminRepo.getRecentActivity).toHaveBeenCalledWith(1, 50);
        });
    });

    describe('logActivity', () => {
        it('should delegate to repository', async () => {
            const input = { user_id: 'admin-1', action: 'test', entity_type: 'test', entity_id: '1' } as any;

            await adminService.logActivity(input);

            expect(mockAdminRepo.logActivity).toHaveBeenCalledWith(input);
        });
    });
});
