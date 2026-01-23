'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Submit a new review for an event
 */
export async function submitReview(eventId: string, rating: number, comment?: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'You must be logged in to submit a review' };
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
        return { success: false, error: 'Rating must be between 1 and 5' };
    }

    // Check if user can review this event
    const { data: canReview } = await supabase.rpc('can_user_review_event', {
        p_user_id: user.id,
        p_event_id: eventId
    });

    if (!canReview) {
        return { success: false, error: 'You are not eligible to review this event' };
    }

    // Get the booking_id for this user and event
    const { data: booking } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .eq('status', 'confirmed')
        .single();

    // Insert the review
    const { data, error } = await supabase
        .from('event_reviews')
        .insert({
            event_id: eventId,
            user_id: user.id,
            booking_id: booking?.id,
            rating,
            comment: comment?.trim() || null
        })
        .select()
        .single();

    if (error) {
        console.error('Error submitting review:', error);
        return { success: false, error: 'Failed to submit review' };
    }

    // Revalidate the event page
    revalidatePath(`/events/${eventId}`);

    return { success: true, data };
}

/**
 * Update an existing review
 */
export async function updateReview(reviewId: string, rating: number, comment?: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'You must be logged in to update a review' };
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
        return { success: false, error: 'Rating must be between 1 and 5' };
    }

    // Update the review (RLS ensures user owns it)
    const { data, error } = await supabase
        .from('event_reviews')
        .update({
            rating,
            comment: comment?.trim() || null
        })
        .eq('id', reviewId)
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating review:', error);
        return { success: false, error: 'Failed to update review' };
    }

    // Revalidate
    if (data?.event_id) {
        revalidatePath(`/events/${data.event_id}`);
    }

    return { success: true, data };
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'You must be logged in to delete a review' };
    }

    // Get event_id before deletion for revalidation
    const { data: review } = await supabase
        .from('event_reviews')
        .select('event_id')
        .eq('id', reviewId)
        .eq('user_id', user.id)
        .single();

    // Delete the review (RLS ensures user owns it)
    const { error } = await supabase
        .from('event_reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting review:', error);
        return { success: false, error: 'Failed to delete review' };
    }

    // Revalidate
    if (review?.event_id) {
        revalidatePath(`/events/${review.event_id}`);
    }

    return { success: true };
}

/**
 * Get paginated reviews for an event
 */
export async function getEventReviews(eventId: string, page = 1, limit = 20, sortBy: 'newest' | 'highest' | 'helpful' = 'newest') {
    const supabase = await createClient();

    const offset = (page - 1) * limit;

    let query = supabase
        .from('event_reviews')
        .select(`
      *,
      profiles:user_id (
        full_name,
        avatar_url
      )
    `, { count: 'exact' })
        .eq('event_id', eventId);

    // Apply sorting
    switch (sortBy) {
        case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
        case 'highest':
            query = query.order('rating', { ascending: false }).order('created_at', { ascending: false });
            break;
        case 'helpful':
            // For helpful, we'll need to join with review_helpful count
            // For now, default to newest with a TODO
            query = query.order('created_at', { ascending: false });
            break;
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching reviews:', error);
        return { success: false, error: 'Failed to fetch reviews' };
    }

    // Get helpful counts for each review
    const reviewsWithHelpful = await Promise.all(
        (data || []).map(async (review) => {
            const { data: helpfulData } = await supabase.rpc('get_review_helpful_count', {
                p_review_id: review.id
            });

            return {
                ...review,
                helpful_count: helpfulData?.[0]?.helpful_count || 0,
                not_helpful_count: helpfulData?.[0]?.not_helpful_count || 0
            };
        })
    );

    return {
        success: true,
        data: reviewsWithHelpful,
        count: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
    };
}

/**
 * Mark a review as helpful or not helpful
 */
export async function markReviewHelpful(reviewId: string, isHelpful: boolean) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'You must be logged in to vote' };
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
        .from('review_helpful')
        .select('id, is_helpful')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .single();

    if (existingVote) {
        // Update existing vote
        if (existingVote.is_helpful === isHelpful) {
            // Same vote, remove it (toggle off)
            const { error } = await supabase
                .from('review_helpful')
                .delete()
                .eq('id', existingVote.id);

            if (error) {
                console.error('Error removing vote:', error);
                return { success: false, error: 'Failed to remove vote' };
            }
        } else {
            // Different vote, update it
            const { error } = await supabase
                .from('review_helpful')
                .update({ is_helpful: isHelpful })
                .eq('id', existingVote.id);

            if (error) {
                console.error('Error updating vote:', error);
                return { success: false, error: 'Failed to update vote' };
            }
        }
    } else {
        // Insert new vote
        const { error } = await supabase
            .from('review_helpful')
            .insert({
                review_id: reviewId,
                user_id: user.id,
                is_helpful: isHelpful
            });

        if (error) {
            console.error('Error inserting vote:', error);
            return { success: false, error: 'Failed to vote' };
        }
    }

    return { success: true };
}

/**
 * Flag a review as inappropriate
 */
export async function flagReview(reviewId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'You must be logged in to flag a review' };
    }

    // Update the review to set is_flagged = true
    // Note: Only admins should be able to unflag, so we don't need RLS check here
    // But we should log who flagged it (could add a separate flagged_by table)
    const { error } = await supabase
        .from('event_reviews')
        .update({ is_flagged: true })
        .eq('id', reviewId);

    if (error) {
        console.error('Error flagging review:', error);
        return { success: false, error: 'Failed to flag review' };
    }

    return { success: true };
}

/**
 * Get event rating summary
 */
export async function getEventRatingSummary(eventId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_event_rating_summary', {
        p_event_id: eventId
    });

    if (error) {
        console.error('Error fetching rating summary:', error);
        return {
            success: false,
            data: {
                average_rating: 0,
                review_count: 0,
                rating_1_count: 0,
                rating_2_count: 0,
                rating_3_count: 0,
                rating_4_count: 0,
                rating_5_count: 0
            }
        };
    }

    return { success: true, data: data?.[0] || {} };
}

/**
 * Check if current user can review an event
 */
export async function checkCanReviewEvent(eventId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { canReview: false, reason: 'not_logged_in' };
    }

    const { data: canReview } = await supabase.rpc('can_user_review_event', {
        p_user_id: user.id,
        p_event_id: eventId
    });

    if (canReview) {
        return { canReview: true };
    }

    // Check specific reasons why they can't review
    const { data: hasBooking } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .eq('status', 'confirmed')
        .single();

    if (!hasBooking) {
        return { canReview: false, reason: 'not_attended' };
    }

    const { data: hasReviewed } = await supabase
        .from('event_reviews')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .single();

    if (hasReviewed) {
        return { canReview: false, reason: 'already_reviewed', reviewId: hasReviewed.id };
    }

    return { canReview: false, reason: 'event_not_passed' };
}

/**
 * Get user's review for an event
 */
export async function getUserReviewForEvent(eventId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, data: null };
    }

    const { data, error } = await supabase
        .from('event_reviews')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching user review:', error);
        return { success: false, data: null };
    }

    return { success: true, data };
}
