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
        const { data, error } = await this.client
            .from('bookings')
            .select(`
        *,
        events (title, event_type)
      `)
            .eq('vendor_id', vendorId)
            .order('created_at', { ascending: false });

        if (error) this.handleError(error, 'BookingRepository.findByVendorId');
        return data || [];
    }

    /**
     * Get user bookings with related data
     */
    async findByUserId(userId: string) {
        const { data, error } = await this.client
            .from('bookings')
            .select('*, event:events(*, vendors(business_name, company_logo, bank_name, bank_account_name, bank_iban))')
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
        profiles:user_id (full_name, email)
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
}
