import { BaseRepository } from './base.repository';
import { Tables, TablesInsert, TablesUpdate } from '@/types/database.types';

type Review = Tables<'event_reviews'>;
type ReviewInsert = TablesInsert<'event_reviews'>;
type ReviewUpdate = TablesUpdate<'event_reviews'>;

/**
 * Review Repository
 * Handles all database operations for event reviews
 */
export class ReviewRepository extends BaseRepository {
    /**
     * Find review by ID
     */
    async findById(id: string): Promise<Review | null> {
        const { data, error } = await this.client
            .from('event_reviews')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (this.isNotFoundError(error)) return null;
            this.handleError(error, 'ReviewRepository.findById');
        }

        return data;
    }

    /**
     * Get reviews for an event with pagination
     */
    async findByEventId(
        eventId: string,
        page: number = 1,
        limit: number = 20,
        sortBy: 'newest' | 'highest' | 'helpful' = 'newest'
    ) {
        const offset = (page - 1) * limit;

        let query = this.client
            .from('event_reviews')
            .select(`
        *,
        profiles:user_id (full_name, avatar_url)
      `)
            .eq('event_id', eventId)
            .eq('is_flagged', false);

        // Apply sorting
        if (sortBy === 'newest') {
            query = query.order('created_at', { ascending: false });
        } else if (sortBy === 'highest') {
            query = query.order('rating', { ascending: false });
        }
        // Note: 'helpful' sorting would need additional RPC or join

        query = query.range(offset, offset + limit - 1);

        const { data, error } = await query;

        if (error) this.handleError(error, 'ReviewRepository.findByEventId');
        return data || [];
    }

    /**
     * Get rating summary for an event
     */
    async getRatingSummary(eventId: string) {
        const { data, error } = await this.client
            .rpc('get_event_rating_summary', { p_event_id: eventId });

        if (error) this.handleError(error, 'ReviewRepository.getRatingSummary');

        if (!data || data.length === 0) {
            return {
                average: 0,
                count: 0,
                rating_1_count: 0,
                rating_2_count: 0,
                rating_3_count: 0,
                rating_4_count: 0,
                rating_5_count: 0
            };
        }

        return data[0];
    }

    /**
     * Get user's review for an event
     */
    async findByUserAndEvent(userId: string, eventId: string): Promise<Review | null> {
        const { data, error } = await this.client
            .from('event_reviews')
            .select('*')
            .eq('user_id', userId)
            .eq('event_id', eventId)
            .single();

        if (error) {
            if (this.isNotFoundError(error)) return null;
            this.handleError(error, 'ReviewRepository.findByUserAndEvent');
        }

        return data;
    }

    /**
     * Check if user can review event
     */
    async canUserReview(userId: string, eventId: string): Promise<boolean> {
        const { data, error } = await this.client
            .rpc('can_user_review_event', {
                p_user_id: userId,
                p_event_id: eventId
            });

        if (error) this.handleError(error, 'ReviewRepository.canUserReview');
        return data || false;
    }

    /**
     * Create review
     */
    async create(review: ReviewInsert): Promise<Review> {
        const { data, error } = await this.client
            .from('event_reviews')
            .insert(review)
            .select()
            .single();

        if (error) this.handleError(error, 'ReviewRepository.create');
        return data;
    }

    /**
     * Update review
     */
    async update(id: string, userId: string, updates: ReviewUpdate): Promise<Review> {
        const { data, error } = await this.client
            .from('event_reviews')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) this.handleError(error, 'ReviewRepository.update');
        return data;
    }

    /**
     * Delete review
     */
    async delete(id: string, userId: string): Promise<void> {
        const { error } = await this.client
            .from('event_reviews')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) this.handleError(error, 'ReviewRepository.delete');
    }

    /**
     * Flag review as inappropriate
     */
    async flag(id: string): Promise<void> {
        const { error } = await this.client
            .from('event_reviews')
            .update({ is_flagged: true })
            .eq('id', id);

        if (error) this.handleError(error, 'ReviewRepository.flag');
    }

    /**
     * Mark review as helpful/not helpful
     */
    async markHelpful(reviewId: string, userId: string, isHelpful: boolean): Promise<void> {
        // First, try to update existing vote
        const { data: existing } = await this.client
            .from('review_helpful')
            .select('id')
            .eq('review_id', reviewId)
            .eq('user_id', userId)
            .single();

        if (existing) {
            // Update existing vote
            const { error } = await this.client
                .from('review_helpful')
                .update({ is_helpful: isHelpful })
                .eq('id', existing.id);

            if (error) this.handleError(error, 'ReviewRepository.markHelpful.update');
        } else {
            // Insert new vote
            const { error } = await this.client
                .from('review_helpful')
                .insert({
                    review_id: reviewId,
                    user_id: userId,
                    is_helpful: isHelpful
                });

            if (error) this.handleError(error, 'ReviewRepository.markHelpful.insert');
        }
    }

    /**
     * Remove helpful vote
     */
    async removeHelpfulVote(reviewId: string, userId: string): Promise<void> {
        const { error } = await this.client
            .from('review_helpful')
            .delete()
            .eq('review_id', reviewId)
            .eq('user_id', userId);

        if (error) this.handleError(error, 'ReviewRepository.removeHelpfulVote');
    }

    /**
     * Get helpful count for review
     */
    async getHelpfulCount(reviewId: string) {
        const { data, error } = await this.client
            .rpc('get_review_helpful_count', { p_review_id: reviewId });

        if (error) this.handleError(error, 'ReviewRepository.getHelpfulCount');

        if (!data || data.length === 0) {
            return { helpful_count: 0, not_helpful_count: 0 };
        }

        return data[0];
    }
}
