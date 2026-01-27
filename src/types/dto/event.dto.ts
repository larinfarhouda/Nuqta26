import { Tables } from '@/types/database.types';

// Base types from database
export type Event = Tables<'events'>;
export type Ticket = Tables<'tickets'>;
export type BulkDiscount = Tables<'bulk_discounts'>;

/**
 * Public Event DTO - Full event details for public pages
 */
export interface PublicEventDTO {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    date: string;
    end_date: string | null;
    location_name: string | null;
    city: string | null;
    district: string | null;
    country: string | null;
    image_url: string | null;
    status: string | null;
    event_type: string | null;
    capacity: number | null;
    location_lat: number | null;
    location_long: number | null;
    category_id: string | null;
    vendor_id: string;

    // Related data
    tickets: Ticket[];
    vendor: {
        business_name: string;
        company_logo: string | null;
        slug: string | null;
        whatsapp_number: string | null;
        bank_name: string | null;
        bank_account_name: string | null;
        bank_iban: string | null;
    } | null;
    bulk_discounts: BulkDiscount[];
    rating?: {
        average: number;
        count: number;
    };
}

/**
 * Event List Item DTO - Simplified event for listings
 */
export interface EventListItemDTO {
    id: string;
    slug: string;
    title: string;
    date: string;
    city: string | null;
    district: string | null;
    image_url: string | null;
    price: number;
    vendor_name: string;
    vendor_logo: string | null;
    category_name_en: string;
    category_name_ar: string | null;
    category_icon: string;
    category_slug: string;
    dist_km?: number;
}

/**
 * Event Filters for querying
 */
export interface EventFilters {
    search?: string;
    category?: string;
    date?: 'today' | 'tomorrow' | 'weekend' | 'week';
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    lat?: number;
    lng?: number;
    radius?: number;
}

/**
 * Create Event Input
 */
export interface CreateEventInput {
    title: string;
    description?: string;
    date: string;
    end_date?: string;
    location_name?: string;
    city?: string;
    district?: string;
    country?: string;
    image_url?: string;
    event_type?: string;
    capacity?: number;
    category_id?: string;
    location_lat?: number;
    location_long?: number;
    is_recurring?: boolean;
    recurrence_type?: string;
    recurrence_days?: string[];
    recurrence_end_date?: string;
    slug?: string;
    status?: string;
}

/**
 * Update Event Input
 */
export type UpdateEventInput = Partial<CreateEventInput>;

/**
 * Booking creation parameters
 */
export interface CreateBookingParams {
    eventId: string;
    ticketId: string;
    quantity: number;
    discountCode?: string;
}

/**
 * Booking result
 */
export interface BookingResult {
    success: boolean;
    bookingId?: string;
    error?: string;
}
