/**
 * Public Events Server Action Tests
 * Tests for public event retrieval actions
 */

import { getPublicEvent, getPublicEvents } from '@/actions/public/events';

// Mock all external dependencies
jest.mock('@/utils/supabase/server', () => ({
    createClient: jest.fn(),
}));

jest.mock('@/lib/track-activity', () => ({
    trackActivity: jest.fn(),
}));

jest.mock('@/lib/rate-limit/rate-limiter', () => ({
    checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 10, reset: Date.now() + 60000 }),
    RateLimiters: { booking: jest.fn() },
}));

jest.mock('@/lib/validation/action-schemas', () => ({
    CreateBookingSchema: { safeParse: jest.fn().mockReturnValue({ success: true, data: {} }) },
    validateInput: jest.fn().mockReturnValue({ success: true, data: {} }),
}));

const mockGetEventService = jest.fn();
const mockGetBookingService = jest.fn();

jest.mock('@/services/service-factory', () => ({
    ServiceFactory: jest.fn().mockImplementation(() => ({
        getEventService: mockGetEventService,
        getBookingService: mockGetBookingService,
        getDiscountService: jest.fn().mockReturnValue({}),
        getNotificationService: jest.fn().mockReturnValue({}),
    })),
}));

import { createClient } from '@/utils/supabase/server';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Public Event Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockCreateClient.mockResolvedValue({
            auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
            from: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                insert: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
            rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
        } as any);
    });

    describe('getPublicEvent', () => {
        it('should return event when found', async () => {
            const event = { id: 'e1', title: 'Concert', tickets: [] };
            mockGetEventService.mockReturnValue({
                getPublicEvent: jest.fn().mockResolvedValue(event),
            });

            const result = await getPublicEvent('test-event');

            expect(result).toEqual(event);
        });

        it('should return null when not found', async () => {
            mockGetEventService.mockReturnValue({
                getPublicEvent: jest.fn().mockResolvedValue(null),
            });

            const result = await getPublicEvent('nonexistent');

            expect(result).toBeNull();
        });

        it('should return null on error', async () => {
            mockGetEventService.mockReturnValue({
                getPublicEvent: jest.fn().mockRejectedValue(new Error('DB error')),
            });

            const result = await getPublicEvent('test-event');

            expect(result).toBeNull();
        });
    });

    describe('getPublicEvents', () => {
        it('should return events with no filters', async () => {
            const events = [{ id: 'e1' }, { id: 'e2' }];
            mockGetEventService.mockReturnValue({
                searchPublicEvents: jest.fn().mockResolvedValue(events),
            });

            const result = await getPublicEvents();

            expect(result).toEqual(events);
        });

        it('should pass filters to service', async () => {
            const mockSearch = jest.fn().mockResolvedValue([]);
            mockGetEventService.mockReturnValue({
                searchPublicEvents: mockSearch,
            });

            const filters = { search: 'concert', category: 'music' };
            await getPublicEvents(filters);

            expect(mockSearch).toHaveBeenCalledWith(filters);
        });

        it('should return empty array on error', async () => {
            mockGetEventService.mockReturnValue({
                searchPublicEvents: jest.fn().mockRejectedValue(new Error('fail')),
            });

            const result = await getPublicEvents();

            expect(result).toEqual([]);
        });
    });
});
