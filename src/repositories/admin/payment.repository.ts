import { BaseRepository } from '../base.repository';
import type {
    BankTransferBooking,
    PaginatedResult,
} from '@/types/admin.types';

/**
 * Admin Payment Repository
 * Data access for bank transfer queue and payment confirmation/rejection.
 * Uses service role key (bypasses RLS) — must only be used server-side.
 */
export class AdminPaymentRepository extends BaseRepository {

    async getBankTransferQueue(page: number, pageSize: number): Promise<PaginatedResult<BankTransferBooking>> {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await this.client
            .from('bookings')
            .select(`
                id, user_id, event_id, vendor_id, status, total_amount, discount_amount,
                payment_method, payment_proof_url, payment_note,
                contact_name, contact_email, contact_phone, created_at,
                profiles(full_name, email),
                events(title, date),
                vendors(business_name)
            `, { count: 'exact' })
            .in('status', ['payment_submitted', 'pending_payment'])
            .eq('payment_method', 'bank_transfer')
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) this.handleError(error, 'AdminPaymentRepository.getBankTransferQueue');

        const total = count || 0;
        return {
            data: (data || []) as unknown as BankTransferBooking[],
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    async confirmPayment(bookingId: string) {
        // Get booking to know ticket info
        const { data: booking, error: fetchError } = await this.client
            .from('bookings')
            .select('id, event_id, status')
            .eq('id', bookingId)
            .single();

        if (fetchError) this.handleError(fetchError, 'AdminPaymentRepository.confirmPayment.fetch');

        // Get booking items to compute quantity
        const { data: items, error: itemsError } = await this.client
            .from('booking_items')
            .select('ticket_id')
            .eq('booking_id', bookingId);

        if (itemsError) this.handleError(itemsError, 'AdminPaymentRepository.confirmPayment.items');

        // Update booking status
        const { error: updateError } = await this.client
            .from('bookings')
            .update({ status: 'confirmed' })
            .eq('id', bookingId);

        if (updateError) this.handleError(updateError, 'AdminPaymentRepository.confirmPayment.update');

        // Increment ticket sold counts
        if (items && items.length > 0) {
            const ticketCounts: Record<string, number> = {};
            items.forEach(item => {
                if (item.ticket_id) {
                    ticketCounts[item.ticket_id] = (ticketCounts[item.ticket_id] || 0) + 1;
                }
            });

            for (const [ticketId, qty] of Object.entries(ticketCounts)) {
                await this.client.rpc('increment_ticket_sold', {
                    ticket_id: ticketId,
                    quantity: qty,
                });
            }
        }
    }

    async rejectPayment(bookingId: string) {
        const { error } = await this.client
            .from('bookings')
            .update({ status: 'pending_payment' })
            .eq('id', bookingId);

        if (error) this.handleError(error, 'AdminPaymentRepository.rejectPayment');
    }
}
