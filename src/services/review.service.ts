import { ReviewRepository } from '@/repositories/review.repository';
import { UserRepository } from '@/repositories/user.repository';
import { NotFoundError, ValidationError } from '@/lib/errors/app-error';
import { logger } from '@/lib/logger/logger';

/**
 * Review Service
 * Handles business logic for event reviews and ratings
 */
export class ReviewService {
    constructor(
        private reviewRepo: ReviewRepository,
        private userRepo: UserRepository
    ) { }

    /**
     * Get reviews for an event
     */
    async getEventReviews(
        eventId: string,
        page: number = 1,
        limit: number = 20,
        sortBy: 'newest' | 'highest' | 'helpful' = 'newest'
    ) {
        logger.info('ReviewService: Fetching event reviews', { eventId, page, sortBy });
        return await this.reviewRepo.findByEventId(eventId, page, limit, sortBy);
    }

    /**
     * Get rating summary for an event
     */
    async getRatingSummary(eventId: string) {
        logger.info('ReviewService: Fetching rating summary', { eventId });
        return await this.reviewRepo.getRatingSummary(eventId);
    }

    /**
     * Check if user can review event
     */
    async canUserReview(userId: string, eventId: string): Promise<boolean> {
        logger.info('ReviewService: Checking review eligibility', { userId, eventId });
        return await this.reviewRepo.canUserReview(userId, eventId);
    }

    /**
     * Create review
     */
    async createReview(params: {
        userId: string;
        eventId: string;
        rating: number;
        comment?: string;
        bookingId?: string;
    }) {
        logger.info('ReviewService: Creating review', {
            userId: params.userId,
            eventId: params.eventId
        });

        // Validation
        if (params.rating < 1 || params.rating > 5) {
            throw new ValidationError('Rating must be between 1 and 5', 'rating');
        }

        if (params.comment && params.comment.length < 10) {
            throw new ValidationError('Comment must be at least 10 characters', 'comment');
        }

        // Check if user can review
        const canReview = await this.reviewRepo.canUserReview(params.userId, params.eventId);
        if (!canReview) {
            throw new ValidationError('You are not eligible to review this event');
        }

        // Check if user already reviewed
        const existingReview = await this.reviewRepo.findByUserAndEvent(
            params.userId,
            params.eventId
        );
        if (existingReview) {
            throw new ValidationError('You have already reviewed this event');
        }

        // Create review
        const review = await this.reviewRepo.create({
            user_id: params.userId,
            event_id: params.eventId,
            rating: params.rating,
            comment: params.comment || null,
            booking_id: params.bookingId || null
        });

        logger.info('Review created successfully', { reviewId: review.id });
        return review;
    }

    /**
     * Update review
     */
    async updateReview(
        reviewId: string,
        userId: string,
        updates: { rating?: number; comment?: string }
    ) {
        logger.info('ReviewService: Updating review', { reviewId, userId });

        // Validation
        if (updates.rating && (updates.rating < 1 || updates.rating > 5)) {
            throw new ValidationError('Rating must be between 1 and 5', 'rating');
        }

        if (updates.comment && updates.comment.length < 10) {
            throw new ValidationError('Comment must be at least 10 characters', 'comment');
        }

        const review = await this.reviewRepo.update(reviewId, userId, {
            rating: updates.rating,
            comment: updates.comment,
            updated_at: new Date().toISOString()
        });

        logger.info('Review updated successfully', { reviewId });
        return review;
    }

    /**
     * Delete review
     */
    async deleteReview(reviewId: string, userId: string): Promise<void> {
        logger.info('ReviewService: Deleting review', { reviewId, userId });

        await this.reviewRepo.delete(reviewId, userId);
        logger.info('Review deleted successfully', { reviewId });
    }

    /**
     * Flag review as inappropriate
     */
    async flagReview(reviewId: string, userId: string): Promise<void> {
        logger.info('ReviewService: Flagging review', { reviewId, flaggedBy: userId });

        // Verify review exists
        const review = await this.reviewRepo.findById(reviewId);
        if (!review) {
            throw new NotFoundError('Review');
        }

        await this.reviewRepo.flag(reviewId);
        logger.info('Review flagged successfully', { reviewId });
    }

    /**
     * Mark review as helpful/not helpful
     */
    async markHelpful(reviewId: string, userId: string, isHelpful: boolean): Promise<void> {
        logger.info('ReviewService: Marking review helpful', { reviewId, userId, isHelpful });

        await this.reviewRepo.markHelpful(reviewId, userId, isHelpful);
        logger.info('Helpful vote recorded', { reviewId, isHelpful });
    }

    /**
     * Remove helpful vote
     */
    async removeHelpfulVote(reviewId: string, userId: string): Promise<void> {
        logger.info('ReviewService: Removing helpful vote', { reviewId, userId });

        await this.reviewRepo.removeHelpfulVote(reviewId, userId);
        logger.info('Helpful vote removed', { reviewId });
    }

    /**
     * Get helpful count for review
     */
    async getHelpfulCount(reviewId: string) {
        logger.info('ReviewService: Fetching helpful count', { reviewId });
        return await this.reviewRepo.getHelpfulCount(reviewId);
    }
}
