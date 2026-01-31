import { BaseRepository } from './base.repository';
import { Tables } from '@/types/database.types';

type Booking = Tables<'bookings'>;

/**
 * Booking Repository
 * Handles all database operations for bookings
 */
export class BookingRepository extends BaseRepository {
    /**
     * Find booking by ID
     */
    async findById(id: string): Promise<Booking | null> {
        const { data, error } = await this.client
            .from('bookings')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (this.isNotFoundError(error)) return null;
            this.handleError(error, 'BookingRepository.findById');
        }

        return data;
    }

    /**
     * Get vendor bookings with related data
     */
    async findByVendorId(vendorId: string) {
        // First, get all bookings for the vendor
        const { data: bookings, error } = await this.client
            .from('bookings')
            .select('*')
            .eq('vendor_id', vendorId)
            .order('created_at', { ascending: false });

        if (error) {
            this.handleError(error, 'BookingRepository.findByVendorId');
            return [];
        }

        if (!bookings || bookings.length === 0) {
            return [];
        }

        // Enrich each booking with event and profile data
        const enrichedBookings = await Promise.all(
            bookings.map(async (booking: any) => {
                const [eventData, profileData] = await Promise.all([
                    this.client
                        .from('events')
                        .select('title, event_type')
                        .eq('id', booking.event_id)
                        .single(),
                    this.client
                        .from('profiles')
                        .select('full_name, email, phone')
                        .eq('id', booking.user_id)
                        .single()
                ]);

                return {
                    ...booking,
                    events: eventData.data,
                    profiles: profileData.data
                };
            })
        );

        return enrichedBookings;
    }

    /**
     * Get user bookings with related data
     */
    async findByUserId(userId: string) {
        const { data, error } = await this.client
            .from('bookings')
            .select('*, event:events(*, vendor:vendors(business_name, company_logo, bank_name, bank_account_name, bank_iban))')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) this.handleError(error, 'BookingRepository.findByUserId');
        return data || [];
    }

    /**
     * Get vendor customers (confirmed bookings)
     */
    async getVendorCustomers(vendorId: string) {
        const { data, error } = await this.client
            .from('bookings')
            .select(`
        user_id,
        total_amount,
        created_at,
        status,
        events (event_type)
      `)
            .eq('vendor_id', vendorId)
            .neq('status', 'cancelled');

        if (error) this.handleError(error, 'BookingRepository.getVendorCustomers');
        return data || [];
    }

    /**
     * Get booking with full details (event, user)
     */
    async findByIdWithDetails(id: string) {
        const { data, error } = await this.client
            .from('bookings')
            .select(`
        *,
        events (title, date, location_name, city),
        profiles!user_id (full_name, email)
      `)
            .eq('id', id)
            .single();

        if (error) {
            if (this.isNotFoundError(error)) return null;
            this.handleError(error, 'BookingRepository.findByIdWithDetails');
        }

        return data;
    }

    /**
     * Update booking status
     */
    async updateStatus(id: string, vendorId: string, status: string) {
        const { data, error } = await this.client
            .from('bookings')
            .update({ status })
            .eq('id', id)
            .eq('vendor_id', vendorId)
            .select();

        if (error) this.handleError(error, 'BookingRepository.updateStatus');

        if (!data || data.length === 0) {
            return null;
        }

        return data[0];
    }

    /**
     * Get pending bookings count for vendor
     */
    async getPendingCount(vendorId: string): Promise<number> {
        const { count, error } = await this.client
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('vendor_id', vendorId)
            .eq('status', 'payment_submitted');

        if (error) this.handleError(error, 'BookingRepository.getPendingCount');
        return count || 0;
    }

    /**
     * Get confirmed bookings for analytics
     */
    async getConfirmedBookings(vendorId: string) {
        const { data, error } = await this.client
            .from('bookings')
            .select('total_amount, status, created_at')
            .eq('vendor_id', vendorId)
            .eq('status', 'confirmed');

        if (error) this.handleError(error, 'BookingRepository.getConfirmedBookings');
        return data || [];
    }

    /**
   * Create booking using RPC (transactional)
   * Note: This RPC might need to be created in your database
   */
    async createWithTransaction(params: {
        p_event_id: string;
        p_ticket_id: string;
        p_quantity: number;
        p_user_id: string;
        p_total_amount: number;
        p_discount_amount: number;
        p_discount_code_id: string | null;
    }) {
        // TODO: Implement place_booking RPC or use standard insert
        // const { data, error } = await this.client.rpc('place_booking', params);
        // if (error) this.handleError(error, 'BookingRepository.createWithTransaction');
        // return data;

        throw new Error('createWithTransaction RPC not implemented yet - use standard create');
    }

    /**
     * Delete unpaid booking
     * Only allows deletion of bookings with status 'pending_payment' or 'payment_submitted'
     */
    async deleteUnpaidBooking(bookingId: string, userId: string): Promise<boolean> {
        const { error } = await this.client
            .from('bookings')
            .delete()
            .eq('id', bookingId)
            .eq('user_id', userId)
            .in('status', ['pending_payment', 'payment_submitted']);

        if (error) {
            this.handleError(error, 'BookingRepository.deleteUnpaidBooking');
            return false;
        }

        return true;
    }

    /**
     * Get booking items count for a booking
     */
    async getBookingItemsCount(bookingId: string): Promise<number> {
        const { count, error } = await this.client
            .from('booking_items')
            .select('*', { count: 'exact', head: true })
            .eq('booking_id', bookingId);

        if (error) this.handleError(error, 'BookingRepository.getBookingItemsCount');
        return count || 0;
    }

    /**
     * Find existing pending or payment_submitted booking for a user and event
     * Returns the booking if found, null otherwise
     */
    async findPendingBookingByUserAndEvent(userId: string, eventId: string): Promise<Booking | null> {
        const { data, error } = await this.client
            .from('bookings')
            .select('*')
            .eq('user_id', userId)
            .eq('event_id', eventId)
            .in('status', ['pending_payment', 'payment_submitted'])
            .maybeSingle();

        if (error) {
            this.handleError(error, 'BookingRepository.findPendingBookingByUserAndEvent');
            return null;
        }

        return data;
    }
}
