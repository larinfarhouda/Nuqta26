import { EventRepository } from '@/repositories/event.repository';
import { TicketRepository } from '@/repositories/ticket.repository';
import { VendorRepository } from '@/repositories/vendor.repository';
import { ReviewRepository } from '@/repositories/review.repository';
import { DiscountRepository } from '@/repositories/discount.repository';
import { CategoryRepository } from '@/repositories/category.repository';
import { PublicEventDTO, EventListItemDTO, EventFilters, CreateEventInput, UpdateEventInput } from '@/types/dto/event.dto';
import { NotFoundError, ValidationError } from '@/lib/errors/app-error';
import { logger } from '@/lib/logger/logger';

/**
 * Event Service
 * Handles business logic for event operations
 */
export class EventService {
    constructor(
        private eventRepo: EventRepository,
        private ticketRepo: TicketRepository,
        private vendorRepo: VendorRepository,
        private reviewRepo: ReviewRepository,
        private discountRepo: DiscountRepository,
        private categoryRepo: CategoryRepository
    ) { }

    /**
     * Get public event by slug or ID with full details
     */
    async getPublicEvent(slugOrId: string): Promise<PublicEventDTO | null> {
        logger.info('EventService: Fetching public event', { slugOrId });

        const eventData = await this.eventRepo.findPublicEvent(slugOrId);
        if (!eventData) {
            logger.warn('Event not found', { slugOrId });
            return null;
        }

        // Get rating summary
        const ratingSummary = await this.reviewRepo.getRatingSummary(eventData.id);

        // Build DTO
        return {
            id: eventData.id,
            slug: eventData.slug || '',
            title: eventData.title,
            description: eventData.description,
            date: eventData.date,
            end_date: eventData.end_date,
            location_name: eventData.location_name,
            city: eventData.city,
            district: eventData.district,
            country: eventData.country,
            image_url: eventData.image_url,
            status: eventData.status,
            event_type: eventData.event_type,
            capacity: eventData.capacity,
            location_lat: eventData.location_lat,
            location_long: eventData.location_long,
            category_id: eventData.category_id,
            category_name_en: (eventData as any).category_name_en || null,
            prospect_vendor_id: (eventData as any).prospect_vendor_id || null,
            vendor_id: eventData.vendor_id,
            tickets: eventData.tickets || [],
            vendor: eventData.vendors ? {
                business_name: eventData.vendors.business_name,
                company_logo: eventData.vendors.company_logo,
                slug: eventData.vendors.slug,
                whatsapp_number: eventData.vendors.whatsapp_number,
                bank_name: eventData.vendors.bank_name,
                bank_account_name: eventData.vendors.bank_account_name,
                bank_iban: eventData.vendors.bank_iban
            } : null,
            bulk_discounts: eventData.bulk_discounts || [],
            rating: ratingSummary ? {
                average: (ratingSummary as any).average_rating || (ratingSummary as any).average || 0,
                count: (ratingSummary as any).review_count || (ratingSummary as any).count || 0
            } : undefined
        };
    }

    /**
     * Search public events with filters
     */
    async searchPublicEvents(filters?: EventFilters): Promise<EventListItemDTO[]> {
        logger.info('EventService: Searching events', { filters });
        return await this.eventRepo.findPublicEvents(filters);
    }

    /**
     * Get vendor's events
     */
    async getVendorEvents(vendorId: string) {
        logger.info('EventService: Fetching vendor events', { vendorId });
        return await this.eventRepo.findByVendorId(vendorId);
    }

    /**
     * Create new event (vendor action)
     */
    async createEvent(vendorId: string, input: CreateEventInput) {
        logger.info('EventService: Creating event', { vendorId, title: input.title });

        // Validation
        if (!input.title || input.title.length < 3) {
            throw new ValidationError('Title must be at least 3 characters', 'title');
        }

        if (!input.date) {
            throw new ValidationError('Date is required', 'date');
        }

        // Generate slug from title
        const slug = this.generateSlug(input.title);

        // Create event
        const event = await this.eventRepo.create({
            ...input,
            vendor_id: vendorId,
            slug,
            status: 'published'
        });

        logger.info('Event created successfully', { eventId: event.id, slug });
        return event;
    }

    /**
     * Update event (vendor action)
     */
    async updateEvent(eventId: string, vendorId: string, updates: UpdateEventInput) {
        logger.info('EventService: Updating event', { eventId, vendorId });

        // Verify ownership
        const event = await this.eventRepo.findById(eventId);
        if (!event) {
            throw new NotFoundError('Event');
        }

        if (event.vendor_id !== vendorId) {
            throw new ValidationError('You do not own this event');
        }

        // Update
        const updatedEvent = await this.eventRepo.update(eventId, updates);
        logger.info('Event updated successfully', { eventId });

        return updatedEvent;
    }

    /**
     * Delete event (vendor action)
     */
    async deleteEvent(eventId: string, vendorId: string): Promise<void> {
        logger.info('EventService: Deleting event', { eventId, vendorId });

        // Verify ownership
        const event = await this.eventRepo.findById(eventId);
        if (!event) {
            throw new NotFoundError('Event');
        }

        if (event.vendor_id !== vendorId) {
            throw new ValidationError('You do not own this event');
        }

        await this.eventRepo.delete(eventId);
        logger.info('Event deleted successfully', { eventId });
    }

    /**
     * Publish event (change status to published)
     */
    async publishEvent(eventId: string, vendorId: string) {
        logger.info('EventService: Publishing event', { eventId, vendorId });

        // Verify ownership
        const event = await this.eventRepo.findById(eventId);
        if (!event) {
            throw new NotFoundError('Event');
        }

        if (event.vendor_id !== vendorId) {
            throw new ValidationError('You do not own this event');
        }

        // Validate event has tickets
        const tickets = await this.ticketRepo.findByEventId(eventId);
        if (!tickets || tickets.length === 0) {
            throw new ValidationError('Cannot publish event without tickets');
        }

        // Update status
        return await this.eventRepo.update(eventId, { status: 'published' });
    }

    /**
     * Generate slug from title
     */
    private generateSlug(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            + '-' + Date.now();
    }
}
