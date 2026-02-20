/**
 * TicketRepository Tests
 * Tests for ticket database operations
 */

import { TicketRepository } from '@/repositories/ticket.repository';
import { createMockSupabaseClient } from '../mocks/supabase.mock';
import { mockTicket } from '../mocks/data.mock';

describe('TicketRepository', () => {
    let ticketRepo: TicketRepository;
    let mockClient: ReturnType<typeof createMockSupabaseClient>;

    beforeEach(() => {
        mockClient = createMockSupabaseClient();
        ticketRepo = new TicketRepository(mockClient as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findByEventId', () => {
        it('should return tickets ordered by price ascending', async () => {
            const tickets = [
                mockTicket({ price: 50 }),
                mockTicket({ id: 't2', price: 100 }),
            ];
            mockClient._mocks.order.mockResolvedValueOnce({ data: tickets, error: null });

            const result = await ticketRepo.findByEventId('event-123');

            expect(result).toEqual(tickets);
            expect(mockClient.from).toHaveBeenCalledWith('tickets');
            expect(mockClient._mocks.eq).toHaveBeenCalledWith('event_id', 'event-123');
            expect(mockClient._mocks.order).toHaveBeenCalledWith('price', { ascending: true });
        });

        it('should return empty array when no tickets', async () => {
            mockClient._mocks.order.mockResolvedValueOnce({ data: null, error: null });

            const result = await ticketRepo.findByEventId('event-123');

            expect(result).toEqual([]);
        });

        it('should throw on database error', async () => {
            mockClient._mocks.order.mockResolvedValueOnce({
                data: null,
                error: { message: 'DB error' },
            });

            await expect(ticketRepo.findByEventId('event-123')).rejects.toThrow();
        });
    });

    describe('findByEventIds', () => {
        it('should return tickets for multiple events', async () => {
            const tickets = [
                mockTicket({ event_id: 'e1' }),
                mockTicket({ id: 't2', event_id: 'e2' }),
            ];
            mockClient._mocks.in.mockResolvedValueOnce({ data: tickets, error: null });

            const result = await ticketRepo.findByEventIds(['e1', 'e2']);

            expect(result).toEqual(tickets);
            expect(mockClient._mocks.in).toHaveBeenCalledWith('event_id', ['e1', 'e2']);
        });

        it('should return empty array for empty IDs input', async () => {
            const result = await ticketRepo.findByEventIds([]);

            expect(result).toEqual([]);
            expect(mockClient.from).not.toHaveBeenCalled();
        });

        it('should return empty array when null data', async () => {
            mockClient._mocks.in.mockResolvedValueOnce({ data: null, error: null });

            const result = await ticketRepo.findByEventIds(['e1']);

            expect(result).toEqual([]);
        });
    });

    describe('findById', () => {
        it('should return ticket when found', async () => {
            const ticket = mockTicket();
            mockClient._mocks.single.mockResolvedValueOnce({ data: ticket, error: null });

            const result = await ticketRepo.findById('ticket-123');

            expect(result).toEqual(ticket);
            expect(mockClient._mocks.eq).toHaveBeenCalledWith('id', 'ticket-123');
        });

        it('should return null when not found', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
            });

            const result = await ticketRepo.findById('bad-id');

            expect(result).toBeNull();
        });

        it('should throw on non-not-found errors', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { code: '500', message: 'Server error' },
            });

            await expect(ticketRepo.findById('ticket-123')).rejects.toThrow();
        });
    });
});
