/**
 * Review Repository Tests
 */

import { ReviewRepository } from '@/repositories/review.repository';
import { createMockSupabaseClient } from '../mocks/supabase.mock';

describe('ReviewRepository', () => {
    let repo: ReviewRepository;
    let mockClient: ReturnType<typeof createMockSupabaseClient>;

    beforeEach(() => {
        mockClient = createMockSupabaseClient();
        repo = new ReviewRepository(mockClient as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findById', () => {
        it('should return review when found', async () => {
            const review = { id: 'r1', rating: 5, comment: 'Great!' };
            mockClient._mocks.single.mockResolvedValueOnce({ data: review, error: null });

            const result = await repo.findById('r1');
            expect(result).toEqual(review);
        });

        it('should return null when not found', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116', message: 'not found' },
            });
            const result = await repo.findById('missing');
            expect(result).toBeNull();
        });

        it('should throw on error', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { code: '500', message: 'DB error' },
            });
            await expect(repo.findById('r1')).rejects.toThrow();
        });
    });

    describe('findByEventId', () => {
        it('should return reviews with pagination', async () => {
            const reviews = [
                { id: 'r1', rating: 5, profiles: { full_name: 'John' } },
                { id: 'r2', rating: 4, profiles: { full_name: 'Jane' } },
            ];
            mockClient._mocks.range.mockResolvedValueOnce({ data: reviews, error: null });

            const result = await repo.findByEventId('e1', 1, 20, 'newest');
            expect(result).toEqual(reviews);
            expect(result).toHaveLength(2);
        });

        it('should return empty array when no reviews', async () => {
            mockClient._mocks.range.mockResolvedValueOnce({ data: null, error: null });
            const result = await repo.findByEventId('e1');
            expect(result).toEqual([]);
        });

        it('should support highest sort', async () => {
            mockClient._mocks.range.mockResolvedValueOnce({ data: [], error: null });
            const result = await repo.findByEventId('e1', 1, 20, 'highest');
            expect(result).toEqual([]);
        });

        it('should throw on error', async () => {
            mockClient._mocks.range.mockResolvedValueOnce({
                data: null,
                error: { message: 'DB error' },
            });
            await expect(repo.findByEventId('e1')).rejects.toThrow();
        });
    });

    describe('getRatingSummary', () => {
        it('should return rating summary from RPC', async () => {
            const summary = [{ average: 4.5, count: 10 }];
            mockClient.rpc.mockResolvedValueOnce({ data: summary, error: null });

            const result = await repo.getRatingSummary('e1');
            expect(result).toEqual({ average: 4.5, count: 10 });
        });

        it('should return defaults when no data', async () => {
            mockClient.rpc.mockResolvedValueOnce({ data: [], error: null });
            const result = await repo.getRatingSummary('e1');
            expect(result.average).toBe(0);
            expect(result.count).toBe(0);
        });

        it('should return defaults when data is null', async () => {
            mockClient.rpc.mockResolvedValueOnce({ data: null, error: null });
            const result = await repo.getRatingSummary('e1');
            expect(result.average).toBe(0);
        });

        it('should throw on error', async () => {
            mockClient.rpc.mockResolvedValueOnce({ data: null, error: { message: 'RPC fail' } });
            await expect(repo.getRatingSummary('e1')).rejects.toThrow();
        });
    });

    describe('findByUserAndEvent', () => {
        it('should return review when found', async () => {
            const review = { id: 'r1', rating: 5 };
            mockClient._mocks.single.mockResolvedValueOnce({ data: review, error: null });
            const result = await repo.findByUserAndEvent('u1', 'e1');
            expect(result).toEqual(review);
        });

        it('should return null when not found', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116', message: 'not found' },
            });
            const result = await repo.findByUserAndEvent('u1', 'e1');
            expect(result).toBeNull();
        });
    });

    describe('canUserReview', () => {
        it('should return true when user can review', async () => {
            mockClient.rpc.mockResolvedValueOnce({ data: true, error: null });
            const result = await repo.canUserReview('u1', 'e1');
            expect(result).toBe(true);
        });

        it('should return false by default', async () => {
            mockClient.rpc.mockResolvedValueOnce({ data: null, error: null });
            const result = await repo.canUserReview('u1', 'e1');
            expect(result).toBe(false);
        });
    });

    describe('create', () => {
        it('should create and return review', async () => {
            const review = { id: 'r1', rating: 5, comment: 'Great!' };
            mockClient._mocks.single.mockResolvedValueOnce({ data: review, error: null });

            const result = await repo.create({ event_id: 'e1', user_id: 'u1', rating: 5, comment: 'Great!' } as any);
            expect(result).toEqual(review);
        });

        it('should throw on error', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { message: 'Insert failed' },
            });
            await expect(repo.create({ event_id: 'e1', user_id: 'u1', rating: 5 } as any)).rejects.toThrow();
        });
    });

    describe('update', () => {
        it('should update and return review', async () => {
            const updated = { id: 'r1', rating: 4 };
            mockClient._mocks.single.mockResolvedValueOnce({ data: updated, error: null });

            const result = await repo.update('r1', 'u1', { rating: 4 });
            expect(result).toEqual(updated);
        });
    });

    describe('delete', () => {
        it('should call delete with correct params', async () => {
            // The chained .delete().eq().eq() needs the final eq to resolve
            const innerEq = jest.fn().mockResolvedValue({ error: null });
            const outerEq = jest.fn().mockReturnValue({ eq: innerEq });
            mockClient._mocks.delete.mockReturnValueOnce({ eq: outerEq });

            await repo.delete('r1', 'u1');
            expect(mockClient.from).toHaveBeenCalledWith('event_reviews');
            expect(outerEq).toHaveBeenCalledWith('id', 'r1');
            expect(innerEq).toHaveBeenCalledWith('user_id', 'u1');
        });

        it('should throw on error', async () => {
            const innerEq = jest.fn().mockResolvedValue({ error: { message: 'Delete failed' } });
            const outerEq = jest.fn().mockReturnValue({ eq: innerEq });
            mockClient._mocks.delete.mockReturnValueOnce({ eq: outerEq });

            await expect(repo.delete('r1', 'u1')).rejects.toThrow();
        });
    });

    describe('flag', () => {
        it('should flag review without error', async () => {
            mockClient._mocks.eq.mockResolvedValueOnce({ error: null });
            await expect(repo.flag('r1')).resolves.toBeUndefined();
        });
    });

    describe('removeHelpfulVote', () => {
        it('should call delete with correct params', async () => {
            const innerEq = jest.fn().mockResolvedValue({ error: null });
            const outerEq = jest.fn().mockReturnValue({ eq: innerEq });
            mockClient._mocks.delete.mockReturnValueOnce({ eq: outerEq });

            await repo.removeHelpfulVote('r1', 'u1');
            expect(mockClient.from).toHaveBeenCalledWith('review_helpful');
        });
    });

    describe('getHelpfulCount', () => {
        it('should return counts from RPC', async () => {
            mockClient.rpc.mockResolvedValueOnce({
                data: [{ helpful_count: 5, not_helpful_count: 2 }],
                error: null,
            });
            const result = await repo.getHelpfulCount('r1');
            expect(result.helpful_count).toBe(5);
        });

        it('should return zeros when no data', async () => {
            mockClient.rpc.mockResolvedValueOnce({ data: [], error: null });
            const result = await repo.getHelpfulCount('r1');
            expect(result.helpful_count).toBe(0);
        });
    });
});
