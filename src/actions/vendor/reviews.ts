'use server';

import { createClient } from '@/utils/supabase/server';
import { ReviewRepository } from '@/repositories/review.repository';

/**
 * Get all reviews for the current vendor across all events
 */
export async function getVendorAllReviews() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { reviews: [], rating: { average: 0, count: 0 } };

    const reviewRepo = new ReviewRepository(supabase);
    const [reviews, rating] = await Promise.all([
        reviewRepo.getVendorReviews(user.id),
        reviewRepo.getVendorRatingSummary(user.id),
    ]);

    return { reviews, rating };
}

/**
 * Get reviews for a specific event (vendor dashboard)
 */
export async function getEventReviewsForVendor(eventId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { reviews: [], rating: { average: 0, count: 0 } };

    // Verify vendor owns the event
    const { data: event } = await supabase
        .from('events')
        .select('id')
        .eq('id', eventId)
        .eq('vendor_id', user.id)
        .single();

    if (!event) return { reviews: [], rating: { average: 0, count: 0 } };

    const { data: reviews, error } = await supabase
        .from('event_reviews')
        .select(`
            *,
            profiles:user_id (full_name, avatar_url)
        `)
        .eq('event_id', eventId)
        .eq('is_flagged', false)
        .order('created_at', { ascending: false });

    if (error || !reviews) return { reviews: [], rating: { average: 0, count: 0 } };

    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    const rating = reviews.length > 0
        ? { average: total / reviews.length, count: reviews.length }
        : { average: 0, count: 0 };

    return { reviews, rating };
}
