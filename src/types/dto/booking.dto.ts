import { Tables } from '@/types/database.types';

// Base types from database
export type Booking = Tables<'bookings'>;
export type BookingItem = Tables<'booking_items'>;

/**
 * Vendor Booking DTO - for vendor dashboard
 */
export interface VendorBookingDTO extends Booking {
    events: {
        title: string;
        event_type: string | null;
    } | null;
    profiles: {
        full_name: string | null;
        email: string | null;
        avatar_url: string | null;
        phone: string | null;
    };
}

/**
 * User Booking DTO - for user dashboard
 */
export interface UserBookingDTO extends Booking {
    event: {
        title: string;
        date: string;
        location_name: string | null;
        city: string | null;
        image_url: string | null;
        event_type: string | null;
        vendors: {
            business_name: string;
            company_logo: string | null;
            bank_name: string | null;
            bank_account_name: string | null;
            bank_iban: string | null;
        } | null;
    } | null;
}

/**
 * Customer Info DTO - for vendor customer analytics
 */
export interface CustomerDTO {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string | null;
    total_spent: number;
    bookings_count: number;
    last_booking: string;
    types_preferred: string[];
}

/**
 * Update Booking Status Input
 */
export interface UpdateBookingStatusInput {
    bookingId: string;
    status: 'confirmed' | 'cancelled';
}
