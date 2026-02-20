/**
 * Admin Server Action Tests
 */

jest.mock('@/utils/supabase/server', () => ({
    createClient: jest.fn(),
    createAdminClient: jest.fn(),
}));

const mockGetDashboardData = jest.fn();
const mockGetVendorDirectory = jest.fn();
const mockApproveVendor = jest.fn();
const mockSuspendVendor = jest.fn();
const mockGetBankTransferQueue = jest.fn();
const mockConfirmPayment = jest.fn();
const mockRejectPayment = jest.fn();
const mockGetFlaggedReviews = jest.fn();
const mockUnflagReview = jest.fn();
const mockDeleteReview = jest.fn();
const mockToggleFeatureEvent = jest.fn();
const mockGetRecentActivity = jest.fn();
const mockCreateProspectVendor = jest.fn();
const mockGetProspects = jest.fn();
const mockContactProspect = jest.fn();
const mockGetProspectInterests = jest.fn();

jest.mock('@/services/service-factory', () => ({
    ServiceFactory: jest.fn().mockImplementation(() => ({
        getAdminService: jest.fn().mockReturnValue({
            getDashboardData: mockGetDashboardData,
            getVendorDirectory: mockGetVendorDirectory,
            approveVendor: mockApproveVendor,
            suspendVendor: mockSuspendVendor,
            getBankTransferQueue: mockGetBankTransferQueue,
            confirmPayment: mockConfirmPayment,
            rejectPayment: mockRejectPayment,
            getFlaggedReviews: mockGetFlaggedReviews,
            unflagReview: mockUnflagReview,
            deleteReview: mockDeleteReview,
            toggleFeatureEvent: mockToggleFeatureEvent,
            getRecentActivity: mockGetRecentActivity,
            createProspectVendor: mockCreateProspectVendor,
            getProspects: mockGetProspects,
            contactProspect: mockContactProspect,
            getProspectInterests: mockGetProspectInterests,
        }),
    })),
}));

import { createClient, createAdminClient } from '@/utils/supabase/server';
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockCreateAdminClient = createAdminClient as jest.MockedFunction<any>;

// Import after mocking
import {
    getAdminDashboardData,
    getAdminVendors,
    approveVendor,
    suspendVendor,
    getAdminBankTransfers,
    confirmBankPayment,
    rejectBankPayment,
    getAdminFlaggedReviews,
    unflagReview,
    deleteReview,
    toggleFeatureEvent,
    getAdminActivity,
    searchEventsForAdmin,
} from '@/actions/admin';

function setupAdminAuth(isAdmin = true) {
    const mockGetUser = jest.fn().mockResolvedValue({
        data: { user: { id: 'admin1' } },
    });
    const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        single: jest.fn().mockResolvedValue({
            data: { role: isAdmin ? 'admin' : 'user' },
            error: null,
        }),
    });
    mockCreateClient.mockResolvedValue({
        auth: { getUser: mockGetUser },
        from: mockFrom,
    } as any);
    mockCreateAdminClient.mockReturnValue({
        from: mockFrom,
    });
}

describe('Admin Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAdminDashboardData', () => {
        it('should return dashboard data for admin', async () => {
            setupAdminAuth();
            const data = { totalVendors: 10 };
            mockGetDashboardData.mockResolvedValue(data);
            const result = await getAdminDashboardData();
            expect(result).toEqual(data);
        });

        it('should return null when not admin', async () => {
            setupAdminAuth(false);
            const result = await getAdminDashboardData();
            expect(result).toBeNull();
        });

        it('should return null when not authenticated', async () => {
            mockCreateClient.mockResolvedValue({
                auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
            } as any);
            const result = await getAdminDashboardData();
            expect(result).toBeNull();
        });
    });

    describe('getAdminVendors', () => {
        it('should return vendors list', async () => {
            setupAdminAuth();
            const vendors = { data: [{ id: 'v1' }], total: 1 };
            mockGetVendorDirectory.mockResolvedValue(vendors);
            const result = await getAdminVendors(1, 20, 'test');
            expect(result).toEqual(vendors);
        });
    });

    describe('approveVendor', () => {
        it('should approve vendor and return success', async () => {
            setupAdminAuth();
            mockApproveVendor.mockResolvedValue(undefined);
            const result = await approveVendor('v1');
            expect(result).toEqual({ success: true });
        });

        it('should return error on failure', async () => {
            setupAdminAuth();
            mockApproveVendor.mockRejectedValue(new Error('Not found'));
            const result = await approveVendor('v1');
            expect(result.error).toBeDefined();
        });
    });

    describe('suspendVendor', () => {
        it('should suspend vendor and return success', async () => {
            setupAdminAuth();
            mockSuspendVendor.mockResolvedValue(undefined);
            const result = await suspendVendor('v1');
            expect(result).toEqual({ success: true });
        });
    });

    describe('getAdminBankTransfers', () => {
        it('should return bank transfers', async () => {
            setupAdminAuth();
            const data = { data: [{ id: 'b1' }] };
            mockGetBankTransferQueue.mockResolvedValue(data);
            const result = await getAdminBankTransfers();
            expect(result).toEqual(data);
        });
    });

    describe('confirmBankPayment', () => {
        it('should confirm payment and return success', async () => {
            setupAdminAuth();
            mockConfirmPayment.mockResolvedValue(undefined);
            const result = await confirmBankPayment('b1');
            expect(result).toEqual({ success: true });
        });

        it('should return error on failure', async () => {
            setupAdminAuth();
            mockConfirmPayment.mockRejectedValue(new Error('fail'));
            const result = await confirmBankPayment('b1');
            expect(result.error).toBeDefined();
        });
    });

    describe('rejectBankPayment', () => {
        it('should reject payment and return success', async () => {
            setupAdminAuth();
            mockRejectPayment.mockResolvedValue(undefined);
            const result = await rejectBankPayment('b1');
            expect(result).toEqual({ success: true });
        });
    });

    describe('getAdminFlaggedReviews', () => {
        it('should return flagged reviews', async () => {
            setupAdminAuth();
            const data = { data: [{ id: 'r1' }] };
            mockGetFlaggedReviews.mockResolvedValue(data);
            const result = await getAdminFlaggedReviews();
            expect(result).toEqual(data);
        });
    });

    describe('unflagReview', () => {
        it('should unflag and return success', async () => {
            setupAdminAuth();
            mockUnflagReview.mockResolvedValue(undefined);
            const result = await unflagReview('r1');
            expect(result).toEqual({ success: true });
        });
    });

    describe('deleteReview', () => {
        it('should delete and return success', async () => {
            setupAdminAuth();
            mockDeleteReview.mockResolvedValue(undefined);
            const result = await deleteReview('r1');
            expect(result).toEqual({ success: true });
        });
    });

    describe('toggleFeatureEvent', () => {
        it('should toggle feature and return success', async () => {
            setupAdminAuth();
            mockToggleFeatureEvent.mockResolvedValue(undefined);
            const result = await toggleFeatureEvent('e1', true);
            expect(result).toEqual({ success: true });
        });
    });

    describe('getAdminActivity', () => {
        it('should return activity', async () => {
            setupAdminAuth();
            const data = [{ id: 'a1' }];
            mockGetRecentActivity.mockResolvedValue(data);
            const result = await getAdminActivity();
            expect(result).toEqual(data);
        });
    });

    describe('searchEventsForAdmin', () => {
        it('should return matching events', async () => {
            setupAdminAuth();
            const result = await searchEventsForAdmin('concert');
            expect(result).toEqual([]); // from the mock
        });
    });
});
