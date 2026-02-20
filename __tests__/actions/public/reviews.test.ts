/**
 * Public Reviews Server Action Tests
 * Tests for review submission and retrieval actions
 */

import { submitReview, updateReview, deleteReview, getEventRatingSummary, checkCanReviewEvent, getUserReviewForEvent } from '@/actions/public/reviews';

// Mock dependencies
jest.mock('@/utils/supabase/server', () => ({
    createClient: jest.fn(),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

jest.mock('@/lib/track-activity', () => ({
    trackActivity: jest.fn(),
}));

import { createClient } from '@/utils/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Public Review Actions', () => {
    let mockSupabase: any;
    let mockGetUser: jest.Mock;
    let mockRpc: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetUser = jest.fn();
        mockRpc = jest.fn();

        const createQueryBuilder = () => {
            const qb: any = {};
            qb.select = jest.fn().mockReturnValue(qb);
            qb.insert = jest.fn().mockReturnValue(qb);
            qb.update = jest.fn().mockReturnValue(qb);
            qb.delete = jest.fn().mockReturnValue(qb);
            qb.eq = jest.fn().mockReturnValue(qb);
            qb.single = jest.fn().mockResolvedValue({ data: null, error: null });
            qb.range = jest.fn().mockReturnValue(qb);
            qb.order = jest.fn().mockReturnValue(qb);
            qb.then = undefined; // hack to make it not look like a Promise
            return qb;
        };

        mockSupabase = {
            auth: {
                getUser: mockGetUser,
                admin: { getUserById: jest.fn().mockResolvedValue({ data: { user: null } }) },
            },
            from: jest.fn().mockImplementation(() => createQueryBuilder()),
            rpc: mockRpc,
        };

        mockCreateClient.mockResolvedValue(mockSupabase as any);
    });

    describe('submitReview', () => {
        it('should return error when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });

            const result = await submitReview('event-123', 5, 'Great!');

            expect(result.success).toBe(false);
            expect(result.error).toContain('logged in');
        });

        it('should reject invalid rating < 1', async () => {
            mockGetUser.mockResolvedValue({
                data: { user: { id: 'u1', email: 'test@test.com' } },
            });

            const result = await submitReview('event-123', 0, 'Bad');

            expect(result.success).toBe(false);
            expect(result.error).toContain('between 1 and 5');
        });

        it('should reject invalid rating > 5', async () => {
            mockGetUser.mockResolvedValue({
                data: { user: { id: 'u1', email: 'test@test.com' } },
            });

            const result = await submitReview('event-123', 6, 'Too much');

            expect(result.success).toBe(false);
            expect(result.error).toContain('between 1 and 5');
        });

        it('should reject when user is not eligible', async () => {
            mockGetUser.mockResolvedValue({
                data: { user: { id: 'u1', email: 'test@test.com' } },
            });
            mockRpc.mockResolvedValue({ data: false });

            const result = await submitReview('event-123', 5, 'Great!');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not eligible');
        });
    });

    describe('updateReview', () => {
        it('should return error when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });

            const result = await updateReview('review-123', 4);

            expect(result.success).toBe(false);
            expect(result.error).toContain('logged in');
        });

        it('should reject invalid rating', async () => {
            mockGetUser.mockResolvedValue({
                data: { user: { id: 'u1' } },
            });

            const result = await updateReview('review-123', 0);

            expect(result.success).toBe(false);
            expect(result.error).toContain('between 1 and 5');
        });
    });

    describe('deleteReview', () => {
        it('should return error when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });

            const result = await deleteReview('review-123');

            expect(result.success).toBe(false);
            expect(result.error).toContain('logged in');
        });
    });

    describe('getEventRatingSummary', () => {
        it('should return rating summary from RPC', async () => {
            const summary = [{
                average_rating: 4.5,
                review_count: 10,
                rating_1_count: 0,
                rating_2_count: 1,
                rating_3_count: 2,
                rating_4_count: 3,
                rating_5_count: 4,
            }];
            mockRpc.mockResolvedValue({ data: summary, error: null });

            const result = await getEventRatingSummary('event-123');

            expect(result.success).toBe(true);
            expect(result.data.average_rating).toBe(4.5);
        });

        it('should return default summary on error', async () => {
            mockRpc.mockResolvedValue({ data: null, error: { message: 'fail' } });

            const result = await getEventRatingSummary('event-123');

            expect(result.success).toBe(false);
            expect(result.data.average_rating).toBe(0);
            expect(result.data.review_count).toBe(0);
        });

        it('should return default summary when no data', async () => {
            mockRpc.mockResolvedValue({ data: [], error: null });

            const result = await getEventRatingSummary('event-123');

            expect(result.success).toBe(true);
            expect(result.data.average_rating).toBe(0);
        });
    });

    describe('checkCanReviewEvent', () => {
        it('should return not logged in when unauthenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });

            const result = await checkCanReviewEvent('event-123');

            expect(result.canReview).toBe(false);
            expect(result.reason).toBe('not_logged_in');
        });

        it('should return true when user can review', async () => {
            mockGetUser.mockResolvedValue({
                data: { user: { id: 'u1' } },
            });
            mockRpc.mockResolvedValue({ data: true });

            const result = await checkCanReviewEvent('event-123');

            expect(result.canReview).toBe(true);
        });
    });

    describe('getUserReviewForEvent', () => {
        it('should return null data when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });

            const result = await getUserReviewForEvent('event-123');

            expect(result.success).toBe(false);
            expect(result.data).toBeNull();
        });
    });
});
