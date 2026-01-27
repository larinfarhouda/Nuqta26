'use server';

import { createClient } from '@/utils/supabase/server';
import { VendorRepository } from '@/repositories/vendor.repository';
import { TicketRepository } from '@/repositories/ticket.repository';
import { CategoryRepository } from '@/repositories/category.repository';
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

        // Create service and fetch vendor
        const vendorService = new VendorService(vendorRepo, ticketRepo, categoryRepo);
        const vendor = await vendorService.getPublicVendor(slug);

        return vendor;
    } catch (error) {
        logger.error('Failed to get public vendor', { slug, error });
        return null;
    }
}
