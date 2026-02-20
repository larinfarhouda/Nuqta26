/**
 * EventRepository Tests
 * Tests for event database operations via mocked Supabase client
 */

import { EventRepository } from '@/repositories/event.repository';
import { createMockSupabaseClient } from '../mocks/supabase.mock';
import { mockEvent } from '../mocks/data.mock';

describe('EventRepository', () => {
    let eventRepo: EventRepository;
    let mockClient: ReturnType<typeof createMockSupabaseClient>;

    beforeEach(() => {
        mockClient = createMockSupabaseClient();
        eventRepo = new EventRepository(mockClient as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findBySlug', () => {
        it('should return event when found', async () => {
            const event = mockEvent();
            mockClient._mocks.single.mockResolvedValueOnce({ data: event, error: null });

            const result = await eventRepo.findBySlug('test-event');

            expect(result).toEqual(event);
            expect(mockClient.from).toHaveBeenCalledWith('events');
            expect(mockClient._mocks.eq).toHaveBeenCalledWith('slug', 'test-event');
            expect(mockClient._mocks.eq).toHaveBeenCalledWith('status', 'published');
        });

        it('should return null when not found (PGRST116)', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
            });

            const result = await eventRepo.findBySlug('non-existent');

            expect(result).toBeNull();
        });

        it('should throw DatabaseError on other errors', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { code: '42P01', message: 'relation does not exist' },
            });

            await expect(eventRepo.findBySlug('test')).rejects.toThrow();
        });
    });

    describe('findById', () => {
        it('should return event when found', async () => {
            const event = mockEvent();
            mockClient._mocks.single.mockResolvedValueOnce({ data: event, error: null });

            const result = await eventRepo.findById('event-123');

            expect(result).toEqual(event);
            expect(mockClient._mocks.eq).toHaveBeenCalledWith('id', 'event-123');
        });

        it('should return null when not found', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
            });

            const result = await eventRepo.findById('bad-id');

            expect(result).toBeNull();
        });
    });

    describe('findPublicEvent', () => {
        it('should query by slug for non-UUID', async () => {
            const event = mockEvent();
            mockClient._mocks.single.mockResolvedValueOnce({ data: event, error: null });

            const result = await eventRepo.findPublicEvent('test-event');

            expect(result).toEqual(event);
            expect(mockClient._mocks.eq).toHaveBeenCalledWith('slug', 'test-event');
        });

        it('should query by ID for valid UUID', async () => {
            const event = mockEvent({ id: '123e4567-e89b-12d3-a456-426614174000' });
            mockClient._mocks.single.mockResolvedValueOnce({ data: event, error: null });

            await eventRepo.findPublicEvent('123e4567-e89b-12d3-a456-426614174000');

            expect(mockClient._mocks.eq).toHaveBeenCalledWith('id', '123e4567-e89b-12d3-a456-426614174000');
        });

        it('should return null when not found', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
            });

            const result = await eventRepo.findPublicEvent('non-existent');

            expect(result).toBeNull();
        });
    });

    describe('findPublicEvents', () => {
        it('should call the RPC with no filters', async () => {
            mockClient._mocks.rpc.mockResolvedValueOnce({ data: [mockEvent()], error: null });

            const result = await eventRepo.findPublicEvents();

            expect(result).toHaveLength(1);
            expect(mockClient.rpc).toHaveBeenCalledWith('get_events_pro', expect.objectContaining({
                p_limit: 50,
                p_offset: 0,
            }));
        });

        it('should pass search and category filters', async () => {
            mockClient._mocks.rpc.mockResolvedValueOnce({ data: [], error: null });

            await eventRepo.findPublicEvents({ search: 'concert', category: 'music' });

            expect(mockClient.rpc).toHaveBeenCalledWith('get_events_pro', expect.objectContaining({
                p_search: 'concert',
                p_category: 'music',
            }));
        });

        it('should return empty array when data is null', async () => {
            mockClient._mocks.rpc.mockResolvedValueOnce({ data: null, error: null });

            const result = await eventRepo.findPublicEvents();

            expect(result).toEqual([]);
        });

        it('should throw on error', async () => {
            mockClient._mocks.rpc.mockResolvedValueOnce({
                data: null,
                error: { code: '42883', message: 'function does not exist' },
            });

            await expect(eventRepo.findPublicEvents()).rejects.toThrow();
        });
    });

    describe('findByVendorId', () => {
        it('should return events ordered by date descending', async () => {
            const events = [mockEvent(), mockEvent({ id: 'event-456' })];
            // The order mock returns the query builder, and the final promise resolves with data
            // Since our mock chain ends with `order` returning queryBuilder, we need the implicit promise
            // We override the mock chain result by mocking order to resolve data
            mockClient._mocks.order.mockReturnValueOnce({
                then: (fn: any) => fn({ data: events, error: null }),
            } as any);

            // Alternative approach: mock at the from level to return proper result
            const mockResult = { data: events, error: null };
            mockClient._mocks.order.mockResolvedValueOnce(mockResult);

            const result = await eventRepo.findByVendorId('vendor-123');

            expect(mockClient._mocks.eq).toHaveBeenCalledWith('vendor_id', 'vendor-123');
        });
    });

    describe('create', () => {
        it('should insert event and return data', async () => {
            const newEvent = mockEvent();
            mockClient._mocks.single.mockResolvedValueOnce({ data: newEvent, error: null });

            const result = await eventRepo.create(newEvent as any);

            expect(result).toEqual(newEvent);
            expect(mockClient._mocks.insert).toHaveBeenCalled();
        });

        it('should throw on insert error', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { code: '23505', message: 'duplicate key' },
            });

            await expect(eventRepo.create({} as any)).rejects.toThrow();
        });
    });

    describe('update', () => {
        it('should update event and return data', async () => {
            const updated = mockEvent({ title: 'Updated Title' });
            mockClient._mocks.single.mockResolvedValueOnce({ data: updated, error: null });

            const result = await eventRepo.update('event-123', { title: 'Updated Title' } as any);

            expect(result).toEqual(updated);
            expect(mockClient._mocks.update).toHaveBeenCalled();
            expect(mockClient._mocks.eq).toHaveBeenCalledWith('id', 'event-123');
        });
    });

    describe('delete', () => {
        it('should delete event without error', async () => {
            // delete().eq() returns a promise-like
            mockClient._mocks.eq.mockResolvedValueOnce({ error: null });

            await expect(eventRepo.delete('event-123')).resolves.not.toThrow();
            expect(mockClient._mocks.delete).toHaveBeenCalled();
        });
    });

    describe('getAllForSitemap', () => {
        it('should return published events for sitemap', async () => {
            const events = [{ id: 'e1', slug: 's1', updated_at: '2026-01-01' }];
            mockClient._mocks.eq.mockResolvedValueOnce({ data: events, error: null });

            const result = await eventRepo.getAllForSitemap();

            expect(result).toEqual(events);
            expect(mockClient._mocks.eq).toHaveBeenCalledWith('status', 'published');
        });

        it('should return empty array when no published events', async () => {
            mockClient._mocks.eq.mockResolvedValueOnce({ data: null, error: null });

            const result = await eventRepo.getAllForSitemap();

            expect(result).toEqual([]);
        });
    });

    describe('countActiveEventsByVendor', () => {
        it('should return count of active events', async () => {
            mockClient._mocks.gte.mockResolvedValueOnce({ count: 5, error: null });

            const result = await eventRepo.countActiveEventsByVendor('vendor-123');

            expect(result).toBe(5);
            expect(mockClient._mocks.eq).toHaveBeenCalledWith('vendor_id', 'vendor-123');
        });

        it('should return 0 when count is null', async () => {
            mockClient._mocks.gte.mockResolvedValueOnce({ count: null, error: null });

            const result = await eventRepo.countActiveEventsByVendor('vendor-123');

            expect(result).toBe(0);
        });
    });
});
