import { VendorRepository } from '@/repositories/vendor.repository';
import { TicketRepository } from '@/repositories/ticket.repository';
import { CategoryRepository } from '@/repositories/category.repository';
import { PublicVendorDTO, VendorEventItem } from '@/types/dto/vendor.dto';
import { logger } from '@/lib/logger/logger';

/**
 * Vendor Service
 * Handles business logic for vendor operations
 */
export class VendorService {
    constructor(
        private vendorRepo: VendorRepository,
        private ticketRepo: TicketRepository,
        private categoryRepo: CategoryRepository
    ) { }

    /**
     * Get public vendor profile by slug
     */
    async getPublicVendor(slug: string): Promise<PublicVendorDTO | null> {
        logger.info('Fetching public vendor', { slug });

        // 1. Fetch vendor
        const vendor = await this.vendorRepo.findBySlug(slug);
        if (!vendor) {
            logger.warn('Vendor not found', { slug });
            return null;
        }

        // 2. Fetch related data in parallel
        const [gallery, events] = await Promise.all([
            this.vendorRepo.getGallery(vendor.id),
            this.getVendorEventsWithDetails(vendor.id)
        ]);

        // 3. Build DTO
        return {
            id: vendor.id,
            slug: vendor.slug || '',
            business_name: vendor.business_name,
            description_ar: vendor.description_ar,
            company_logo: vendor.company_logo,
            whatsapp_number: vendor.whatsapp_number,
            website: vendor.website,
            category: vendor.category,
            instagram: vendor.instagram,
            banner_url: vendor.cover_image,
            location_lat: vendor.location_lat,
            location_long: vendor.location_long,
            gallery,
            events
        };
    }

    /**
     * Get vendor events with full details (tickets, categories)
     */
    private async getVendorEventsWithDetails(vendorId: string): Promise<VendorEventItem[]> {
        // 1. Get events
        const events = await this.vendorRepo.getUpcomingEvents(vendorId);
        if (events.length === 0) return [];

        // 2. Get tickets and categories in parallel
        const eventIds = events.map(e => e.id);
        const categoryIds = [...new Set(events.map(e => e.category_id).filter(Boolean))] as string[];

        const [tickets, categories] = await Promise.all([
            this.ticketRepo.findByEventIds(eventIds),
            categoryIds.length > 0 ? this.categoryRepo.findByIds(categoryIds) : Promise.resolve([])
        ]);

        // 3. Map events with details
        return events.map(event => {
            const eventTickets = tickets.filter(t => t.event_id === event.id);
            const category = categories.find(c => c.id === event.category_id);

            return {
                id: event.id,
                slug: event.slug || '',
                title: event.title,
                description: event.description,
                date: event.date,
                location_name: event.location_name,
                city: event.city,
                district: event.district,
                image_url: event.image_url,
                category: {
                    name_en: category?.name_en || 'Event',
                    name_ar: category?.name_ar || null,
                    icon: category?.icon || '✨',
                    slug: category?.slug || ''
                },
                tickets: eventTickets.map(t => ({
                    id: t.id,
                    name: t.name,
                    price: t.price,
                    capacity: t.quantity,
                    sold: t.sold
                })),
                price: eventTickets.length > 0
                    ? Math.min(...eventTickets.map(t => t.price || 0))
                    : 0
            };
        });
    }
}
