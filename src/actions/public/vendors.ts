'use server';

import { createClient } from '@/utils/supabase/server';
import { VendorRepository } from '@/repositories/vendor.repository';
import { TicketRepository } from '@/repositories/ticket.repository';
import { CategoryRepository } from '@/repositories/category.repository';
import { ReviewRepository } from '@/repositories/review.repository';
import { VendorService } from '@/services/vendor.service';
import { logger } from '@/lib/logger/logger';

/**
 * Get public vendor profile by slug
 * Returns vendor with gallery and upcoming events
 */
export async function getPublicVendor(slug: string) {
    try {
        // Initialize dependencies
        const supabase = await createClient();
        const vendorRepo = new VendorRepository(supabase);
        const ticketRepo = new TicketRepository(supabase);
        const categoryRepo = new CategoryRepository(supabase);
        const reviewRepo = new ReviewRepository(supabase);

        // Create service and fetch vendor
        const vendorService = new VendorService(vendorRepo, ticketRepo, categoryRepo);
        const vendor = await vendorService.getPublicVendor(slug);

        if (!vendor) return null;

        // Fetch vendor-wide rating + reviews in parallel
        const [vendorRating, vendorReviews] = await Promise.all([
            reviewRepo.getVendorRatingSummary(vendor.id),
            reviewRepo.getVendorReviews(vendor.id),
        ]);

        return {
            ...vendor,
            rating: vendorRating && vendorRating.count > 0 ? vendorRating : null,
            reviews: vendorReviews,
        };
    } catch (error) {
        logger.error('Failed to get public vendor', { slug, error });
        return null;
    }
}

/**
 * Get all vendor slugs for sitemap generation
 * Returns array of vendor slugs and their last update times
 */
export async function getAllVendorSlugsForSitemap() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('vendors')
            .select('slug, updated_at')
            .eq('status', 'approved')
            .not('slug', 'is', null);

        if (error) {
            logger.error('Failed to fetch vendor slugs for sitemap', { error });
            return [];
        }

        return data || [];
    } catch (error) {
        logger.error('Failed to get vendor slugs for sitemap', { error });
        return [];
    }
}
