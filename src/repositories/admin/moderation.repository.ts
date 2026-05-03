import { BaseRepository } from '../base.repository';
import type {
    FlaggedReview,
    PaginatedResult,
} from '@/types/admin.types';

/**
 * Admin Moderation Repository
 * Data access for content moderation — flagged reviews and event featuring.
 * Uses service role key (bypasses RLS) — must only be used server-side.
 */
export class AdminModerationRepository extends BaseRepository {

    async getFlaggedReviews(page: number, pageSize: number): Promise<PaginatedResult<FlaggedReview>> {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await this.client
            .from('event_reviews')
            .select(`
                id, event_id, user_id, rating, comment, is_flagged, created_at,
                events(title),
                profiles!event_reviews_user_id_fkey(full_name, email),
                review_flags(id)
            `, { count: 'exact' })
            .eq('is_flagged', true)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) this.handleError(error, 'AdminModerationRepository.getFlaggedReviews');

        const reviews: FlaggedReview[] = (data || []).map((r: any) => ({
            id: r.id,
            event_id: r.event_id,
            user_id: r.user_id,
            rating: r.rating,
            comment: r.comment,
            is_flagged: r.is_flagged,
            created_at: r.created_at,
            flag_count: r.review_flags?.length || 0,
            event_title: r.events?.title || null,
            reviewer_name: r.profiles?.full_name || null,
            reviewer_email: r.profiles?.email || null,
        }));

        const total = count || 0;
        return { data: reviews, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }

    async unflagReview(reviewId: string) {
        const { error } = await this.client.from('event_reviews').update({ is_flagged: false }).eq('id', reviewId);
        if (error) this.handleError(error, 'AdminModerationRepository.unflagReview');
    }

    async deleteReview(reviewId: string) {
        const { error } = await this.client.from('event_reviews').delete().eq('id', reviewId);
        if (error) this.handleError(error, 'AdminModerationRepository.deleteReview');
    }

    async toggleFeatureEvent(eventId: string, featured: boolean) {
        const { error } = await this.client.from('events').update({
            is_featured: featured,
            featured_at: featured ? new Date().toISOString() : null,
        }).eq('id', eventId);
        if (error) this.handleError(error, 'AdminModerationRepository.toggleFeatureEvent');
    }
}
