/**
 * ReviewService Tests
 * Tests for review management and eligibility checking
 */

import { ReviewService } from '@/services/review.service';
import { ReviewRepository } from '@/repositories/review.repository';
import { UserRepository } from '@/repositories/user.repository';
import { ValidationError, NotFoundError } from '@/lib/errors/app-error';

describe('ReviewService', () => {
    let reviewService: ReviewService;
    let mockReviewRepo: jest.Mocked<ReviewRepository>;
    let mockUserRepo: jest.Mocked<UserRepository>;

    beforeEach(() => {
        mockReviewRepo = {
            findByEventId: jest.fn(),
            findById: jest.fn(),
            canUserReview: jest.fn(),
            findByUserAndEvent: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            flag: jest.fn(),
            getRatingSummary: jest.fn(),
            markHelpful: jest.fn(),
            removeHelpfulVote: jest.fn(),
            getHelpfulCount: jest.fn(),
        } as any;

        mockUserRepo = {
            findById: jest.fn(),
        } as any;

        reviewService = new ReviewService(mockReviewRepo, mockUserRepo);
    });

    describe('createReview', () => {
        it('should create review with valid data', async () => {
            const params = {
                userId: 'user-123',
                eventId: 'event-456',
                rating: 5,
                comment: 'Great event! Highly recommend to everyone.',
            };

            mockReviewRepo.canUserReview.mockResolvedValue(true);
            mockReviewRepo.findByUserAndEvent.mockResolvedValue(null);
            mockReviewRepo.create.mockResolvedValue({
                id: 'review-789',
                ...params,
                user_id: params.userId,
                event_id: params.eventId,
                created_at: new Date().toISOString(),
            } as any);

            const result = await reviewService.createReview(params);

            expect(result.rating).toBe(5);
            expect(mockReviewRepo.create).toHaveBeenCalled();
        });

        it('should throw error when rating is invalid', async () => {
            await expect(
                reviewService.createReview({
                    userId: 'user-123',
                    eventId: 'event-456',
                    rating: 6,
                })
            ).rejects.toThrow(ValidationError);

            await expect(
                reviewService.createReview({
                    userId: 'user-123',
                    eventId: 'event-456',
                    rating: 0,
                })
            ).rejects.toThrow(ValidationError);
        });

        it('should throw error when comment is too short', async () => {
            mockReviewRepo.canUserReview.mockResolvedValue(true);

            await expect(
                reviewService.createReview({
                    userId: 'user-123',
                    eventId: 'event-456',
                    rating: 5,
                    comment: 'Short',
                })
            ).rejects.toThrow(ValidationError);
        });

        it('should throw error when user is not eligible', async () => {
            mockReviewRepo.canUserReview.mockResolvedValue(false);

            await expect(
                reviewService.createReview({
                    userId: 'user-123',
                    eventId: 'event-456',
                    rating: 5,
                })
            ).rejects.toThrow(ValidationError);
        });

        it('should throw error when user already reviewed', async () => {
            mockReviewRepo.canUserReview.mockResolvedValue(true);
            mockReviewRepo.findByUserAndEvent.mockResolvedValue({
                id: 'existing-review',
            } as any);

            await expect(
                reviewService.createReview({
                    userId: 'user-123',
                    eventId: 'event-456',
                    rating: 5,
                })
            ).rejects.toThrow(ValidationError);
        });

        it('should allow review without comment', async () => {
            const params = {
                userId: 'user-123',
                eventId: 'event-456',
                rating: 5,
            };

            mockReviewRepo.canUserReview.mockResolvedValue(true);
            mockReviewRepo.findByUserAndEvent.mockResolvedValue(null);
            mockReviewRepo.create.mockResolvedValue({
                id: 'review-789',
                ...params,
                comment: null,
            } as any);

            const result = await reviewService.createReview(params);

            expect(result.rating).toBe(5);
        });
    });

    describe('getEventReviews', () => {
        it('should return reviews for event', async () => {
            const reviews = [
                { id: 'review-1', rating: 5, comment: 'Great!' },
                { id: 'review-2', rating: 4, comment: 'Good' },
            ];

            mockReviewRepo.findByEventId.mockResolvedValue(reviews as any);

            const result = await reviewService.getEventReviews('event-123');

            expect(result).toHaveLength(2);
            expect(mockReviewRepo.findByEventId).toHaveBeenCalledWith(
                'event-123',
                1,
                20,
                'newest'
            );
        });

        it('should support pagination and sorting', async () => {
            mockReviewRepo.findByEventId.mockResolvedValue([]);

            await reviewService.getEventReviews('event-123', 2, 10, 'highest');

            expect(mockReviewRepo.findByEventId).toHaveBeenCalledWith(
                'event-123',
                2,
                10,
                'highest'
            );
        });
    });

    describe('getRatingSummary', () => {
        it('should return rating summary', async () => {
            const summary = {
                average: 4.5,
                count: 10,
            };

            mockReviewRepo.getRatingSummary.mockResolvedValue(summary as any);

            const result = await reviewService.getRatingSummary('event-123');

            expect(result?.average).toBe(4.5);
            expect(result?.count).toBe(10);
        });

        it('should return null when no reviews', async () => {
            mockReviewRepo.getRatingSummary.mockResolvedValue(null);

            const result = await reviewService.getRatingSummary('event-123');

            expect(result).toBeNull();
        });
    });

    describe('canUserReview', () => {
        it('should return true when user can review', async () => {
            mockReviewRepo.canUserReview.mockResolvedValue(true);

            const result = await reviewService.canUserReview('user-123', 'event-456');

            expect(result).toBe(true);
        });

        it('should return false when user cannot review', async () => {
            mockReviewRepo.canUserReview.mockResolvedValue(false);

            const result = await reviewService.canUserReview('user-123', 'event-456');

            expect(result).toBe(false);
        });
    });

    describe('updateReview', () => {
        it('should update review successfully', async () => {
            const updates = {
                rating: 4,
                comment: 'Updated comment with more details',
            };

            mockReviewRepo.update.mockResolvedValue({
                id: 'review-123',
                ...updates,
            } as any);

            const result = await reviewService.updateReview('review-123', 'user-123', updates);

            expect(result.rating).toBe(4);
        });

        it('should validate rating when updating', async () => {
            await expect(
                reviewService.updateReview('review-123', 'user-123', { rating: 6 })
            ).rejects.toThrow(ValidationError);
        });

        it('should validate comment length when updating', async () => {
            await expect(
                reviewService.updateReview('review-123', 'user-123', { comment: 'Short' })
            ).rejects.toThrow(ValidationError);
        });
    });

    describe('deleteReview', () => {
        it('should delete review successfully', async () => {
            mockReviewRepo.delete.mockResolvedValue(undefined);

            await reviewService.deleteReview('review-123', 'user-123');

            expect(mockReviewRepo.delete).toHaveBeenCalledWith('review-123', 'user-123');
        });
    });

    describe('flagReview', () => {
        it('should flag review as inappropriate', async () => {
            mockReviewRepo.findById.mockResolvedValue({ id: 'review-123' } as any);
            mockReviewRepo.flag.mockResolvedValue(undefined);

            await reviewService.flagReview('review-123', 'user-456');

            expect(mockReviewRepo.flag).toHaveBeenCalledWith('review-123');
        });

        it('should throw error when review not found', async () => {
            mockReviewRepo.findById.mockResolvedValue(null);

            await expect(
                reviewService.flagReview('non-existent', 'user-456')
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('markHelpful', () => {
        it('should mark review as helpful', async () => {
            mockReviewRepo.markHelpful.mockResolvedValue(undefined);

            await reviewService.markHelpful('review-123', 'user-456', true);

            expect(mockReviewRepo.markHelpful).toHaveBeenCalledWith('review-123', 'user-456', true);
        });

        it('should mark review as not helpful', async () => {
            mockReviewRepo.markHelpful.mockResolvedValue(undefined);

            await reviewService.markHelpful('review-123', 'user-456', false);

            expect(mockReviewRepo.markHelpful).toHaveBeenCalledWith('review-123', 'user-456', false);
        });
    });
});
