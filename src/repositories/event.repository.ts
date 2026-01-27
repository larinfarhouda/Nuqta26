import { BaseRepository } from './base.repository';
import { Tables, TablesInsert, TablesUpdate } from '@/types/database.types';
import { EventFilters } from '@/types/dto/event.dto';

type Event = Tables<'events'>;
type EventInsert = TablesInsert<'events'>;
type EventUpdate = TablesUpdate<'events'>;

/**
 * Event Repository
 * Handles all database operations for events
 */
export class EventRepository extends BaseRepository {
    /**
     * Find event by slug
     */
    async findBySlug(slug: string): Promise<Event | null> {
        const { data, error } = await this.client
            .from('events')
            .select('*')
            .eq('slug', slug)
            .eq('status', 'published')
            .single();

        if (error) {
            if (this.isNotFoundError(error)) return null;
            this.handleError(error, 'EventRepository.findBySlug');
        }

        return data;
    }

    /**
     * Find event by ID (any status - for vendor access)
     */
    async findById(id: string): Promise<Event | null> {
        const { data, error } = await this.client
            .from('events')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (this.isNotFoundError(error)) return null;
            this.handleError(error, 'EventRepository.findById');
        }

        return data;
    }

    /**
     * Find public event by ID or slug (published only)
     */
    async findPublicEvent(idOrSlug: string) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

        let query = this.client
            .from('events')
            .select('*, tickets(*), vendors(business_name, company_logo, whatsapp_number, slug, bank_name, bank_account_name, bank_iban), bulk_discounts(*)')
            .eq('status', 'published');

        if (isUuid) {
            query = query.eq('id', idOrSlug);
        } else {
            query = query.eq('slug', idOrSlug);
        }

        const { data, error } = await query.single();

        if (error) {
            if (this.isNotFoundError(error)) return null;
            this.handleError(error, 'EventRepository.findPublicEvent');
        }

        return data;
    }

    /**
     * Get public events with filters (using RPC for complex queries)
     */
    async findPublicEvents(filters?: EventFilters) {
        let dateStart: string | null = null;
        let dateEnd: string | null = null;

        if (filters?.date) {
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();

            if (filters.date === 'today') {
                dateStart = startOfDay;
                dateEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();
            } else if (filters.date === 'tomorrow') {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                dateStart = new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString();
                dateEnd = new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString();
            } else if (filters.date === 'week') {
                dateStart = startOfDay;
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);
                dateEnd = nextWeek.toISOString();
            } else if (filters.date === 'weekend') {
                const friday = new Date(today);
                const day = friday.getDay();
                const diff = 5 - day;
                friday.setDate(friday.getDate() + (diff >= 0 ? diff : diff + 7));
                friday.setHours(0, 0, 0, 0);

                const sunday = new Date(friday);
                sunday.setDate(sunday.getDate() + 2);
                sunday.setHours(23, 59, 59, 999);

                dateStart = friday.toISOString();
                dateEnd = sunday.toISOString();
            }
        }

        const { data, error } = await this.client.rpc('get_events_pro', {
            p_search: filters?.search || undefined,
            p_category: filters?.category || undefined,
            p_min_price: filters?.minPrice || undefined,
            p_max_price: filters?.maxPrice || undefined,
            p_lat: filters?.lat || undefined,
            p_long: filters?.lng || undefined,
            p_radius_km: filters?.radius || undefined,
            p_date_start: dateStart || undefined,
            p_date_end: dateEnd || undefined,
            p_limit: 50,
            p_offset: 0
        });

        if (error) {
            this.handleError(error, 'EventRepository.findPublicEvents');
        }

        return data || [];
    }

    /**
     * Find events by vendor ID
     */
    async findByVendorId(vendorId: string): Promise<Event[]> {
        const { data, error } = await this.client
            .from('events')
            .select('*')
            .eq('vendor_id', vendorId)
            .order('date', { ascending: false });

        if (error) this.handleError(error, 'EventRepository.findByVendorId');
        return data || [];
    }

    /**
     * Create new event
     */
    async create(event: EventInsert): Promise<Event> {
        const { data, error } = await this.client
            .from('events')
            .insert(event)
            .select()
            .single();

        if (error) this.handleError(error, 'EventRepository.create');
        return data;
    }

    /**
     * Update event
     */
    async update(id: string, event: EventUpdate): Promise<Event> {
        const { data, error } = await this.client
            .from('events')
            .update(event)
            .eq('id', id)
            .select()
            .single();

        if (error) this.handleError(error, 'EventRepository.update');
        return data;
    }

    /**
     * Delete event
     */
    async delete(id: string): Promise<void> {
        const { error } = await this.client
            .from('events')
            .delete()
            .eq('id', id);

        if (error) this.handleError(error, 'EventRepository.delete');
    }

    /**
     * Get all event IDs and slugs for sitemap
     */
    async getAllForSitemap() {
        const { data, error } = await this.client
            .from('events')
            .select('id, slug, updated_at')
            .eq('status', 'published');

        if (error) this.handleError(error, 'EventRepository.getAllForSitemap');
        return data || [];
    }
}
