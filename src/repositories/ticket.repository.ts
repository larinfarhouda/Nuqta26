import { BaseRepository } from './base.repository';
import { Tables } from '@/types/database.types';

type Ticket = Tables<'tickets'>;

/**
 * Ticket Repository
 * Handles all database operations for tickets
 */
export class TicketRepository extends BaseRepository {
    /**
     * Find tickets by event ID
     */
    async findByEventId(eventId: string): Promise<Ticket[]> {
        const { data, error } = await this.client
            .from('tickets')
            .select('*')
            .eq('event_id', eventId)
            .order('price', { ascending: true });

        if (error) this.handleError(error, 'TicketRepository.findByEventId');
        return data || [];
    }

    /**
     * Find tickets for multiple events
     */
    async findByEventIds(eventIds: string[]): Promise<Ticket[]> {
        if (eventIds.length === 0) return [];

        const { data, error } = await this.client
            .from('tickets')
            .select('*')
            .in('event_id', eventIds);

        if (error) this.handleError(error, 'TicketRepository.findByEventIds');
        return data || [];
    }

    /**
     * Find ticket by ID
     */
    async findById(id: string): Promise<Ticket | null> {
        const { data, error } = await this.client
            .from('tickets')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (this.isNotFoundError(error)) return null;
            this.handleError(error, 'TicketRepository.findById');
        }

        return data;
    }
}
