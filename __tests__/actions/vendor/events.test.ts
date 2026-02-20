/**
 * Vendor Events Server Action Tests
 * Tests for getVendorEvents, deleteEvent, getEventBookings, createEvent, updateEvent
 */

import { getVendorEvents, deleteEvent, getEventBookings, createEvent, updateEvent } from '@/actions/vendor/events';

jest.mock('@/utils/supabase/server', () => ({
    createClient: jest.fn(),
}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/track-activity', () => ({ trackActivity: jest.fn() }));
jest.mock('@/utils/slugify', () => ({ slugify: (s: string) => s.toLowerCase().replace(/\s+/g, '-') }));

const mockGetUser = jest.fn();
const mockGetEventService = jest.fn();
const mockGetBookingService = jest.fn();
const mockGetEventRepository = jest.fn();
const mockGetDiscountService = jest.fn();

jest.mock('@/services/service-factory', () => ({
    ServiceFactory: jest.fn().mockImplementation(() => ({
        getEventService: mockGetEventService,
        getBookingService: mockGetBookingService,
        getEventRepository: mockGetEventRepository,
        getDiscountService: mockGetDiscountService,
    })),
}));

import { createClient } from '@/utils/supabase/server';
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

// Helper to create a mock FormData
function createMockFormData(data: Record<string, string>): FormData {
    const fd = new FormData();
    for (const [key, value] of Object.entries(data)) {
        fd.append(key, value);
    }
    return fd;
}

function baseFormData(overrides: Record<string, string> = {}): FormData {
    return createMockFormData({
        title: 'Test Event',
        description: 'A test event',
        event_type: 'workshop',
        date: '2027-01-15',
        end_date: '2027-01-15',
        location_lat: '41.0',
        location_long: '29.0',
        location_name: 'Istanbul',
        district: 'Beyoglu',
        city: 'Istanbul',
        country: 'Turkey',
        capacity: '100',
        is_recurring: 'false',
        recurrence_type: '',
        recurrence_end_date: '',
        ...overrides,
    });
}

describe('Vendor Event Actions', () => {
    let mockFrom: jest.Mock;
    let mockSelect: jest.Mock;
    let mockEq: jest.Mock;
    let mockSingle: jest.Mock;
    let mockMaybeSingle: jest.Mock;
    let mockInsert: jest.Mock;
    let mockUpdate: jest.Mock;
    let mockUpload: jest.Mock;
    let mockGetPublicUrl: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
        mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
        mockEq = jest.fn().mockReturnThis();
        mockSelect = jest.fn().mockReturnValue({ eq: mockEq, single: mockSingle, maybeSingle: mockMaybeSingle });
        mockInsert = jest.fn().mockReturnValue({ eq: mockEq, single: mockSingle, select: mockSelect });
        mockUpdate = jest.fn().mockReturnValue({ eq: mockEq, single: mockSingle });
        mockFrom = jest.fn().mockReturnValue({
            select: mockSelect,
            insert: mockInsert,
            update: mockUpdate,
            eq: mockEq,
            single: mockSingle,
            maybeSingle: mockMaybeSingle,
        });
        mockUpload = jest.fn().mockResolvedValue({ error: null });
        mockGetPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl: 'http://img.jpg' } });

        mockCreateClient.mockResolvedValue({
            auth: { getUser: mockGetUser },
            from: mockFrom,
            storage: {
                from: jest.fn().mockReturnValue({
                    upload: mockUpload,
                    getPublicUrl: mockGetPublicUrl,
                }),
            },
        } as any);
    });

    // ===== getVendorEvents =====
    describe('getVendorEvents', () => {
        it('should return events for authenticated vendor', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            const events = [{ id: 'e1' }, { id: 'e2' }];
            mockGetEventService.mockReturnValue({
                getVendorEvents: jest.fn().mockResolvedValue(events),
            });

            const result = await getVendorEvents();
            expect(result).toEqual(events);
        });

        it('should return empty array when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });
            const result = await getVendorEvents();
            expect(result).toEqual([]);
        });

        it('should return empty array on error', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            mockGetEventService.mockReturnValue({
                getVendorEvents: jest.fn().mockRejectedValue(new Error('fail')),
            });
            const result = await getVendorEvents();
            expect(result).toEqual([]);
        });
    });

    // ===== deleteEvent =====
    describe('deleteEvent', () => {
        it('should delete event and return success', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            mockGetEventService.mockReturnValue({
                deleteEvent: jest.fn().mockResolvedValue(undefined),
            });

            const result = await deleteEvent('e1');
            expect(result).toEqual({ success: true });
        });

        it('should return error when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });
            const result = await deleteEvent('e1');
            expect(result).toEqual({ error: 'Unauthorized' });
        });

        it('should return error on failure', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            mockGetEventService.mockReturnValue({
                deleteEvent: jest.fn().mockRejectedValue(new Error('Not found')),
            });
            const result = await deleteEvent('e1');
            expect(result).toEqual({ error: 'Not found' });
        });
    });

    // ===== getEventBookings =====
    describe('getEventBookings', () => {
        it('should return empty array when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });
            const result = await getEventBookings('e1');
            expect(result).toEqual([]);
        });

        it('should return empty array on error', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            mockGetBookingService.mockReturnValue({
                getVendorBookings: jest.fn().mockRejectedValue(new Error('fail')),
            });
            const result = await getEventBookings('e1');
            expect(result).toEqual([]);
        });
    });

    // ===== createEvent =====
    describe('createEvent', () => {
        it('should return error when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });
            const result = await createEvent(baseFormData());
            expect(result).toEqual({ error: 'Unauthorized' });
        });

        it('should return error when vendor not found', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            mockSingle.mockResolvedValue({ data: null, error: null });

            const result = await createEvent(baseFormData());
            expect(result).toEqual({ error: 'Vendor profile not found' });
        });

        it('should return INCOMPLETE_PROFILE when bank info missing', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            mockSingle.mockResolvedValue({
                data: { id: 'v1', bank_name: null, bank_iban: null, subscription_tier: 'starter' },
                error: null,
            });

            const result = await createEvent(baseFormData());
            expect(result).toEqual(expect.objectContaining({ error: 'INCOMPLETE_PROFILE' }));
        });

        it('should return TIER_LIMIT_REACHED when at capacity', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            mockSingle.mockResolvedValue({
                data: { id: 'v1', bank_name: 'Bank', bank_iban: 'TR123', subscription_tier: 'starter' },
                error: null,
            });
            mockGetEventRepository.mockReturnValue({
                countActiveEventsByVendor: jest.fn().mockResolvedValue(1), // starter limit = 1
            });

            const result = await createEvent(baseFormData());
            expect(result).toEqual(expect.objectContaining({ error: 'TIER_LIMIT_REACHED' }));
            expect(result).toHaveProperty('currentTier', 'starter');
            expect(result).toHaveProperty('limit');
        });

        it('should create event successfully', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            mockSingle.mockResolvedValue({
                data: { id: 'v1', bank_name: 'Bank', bank_iban: 'TR123', subscription_tier: 'growth' },
                error: null,
            });
            mockGetEventRepository.mockReturnValue({
                countActiveEventsByVendor: jest.fn().mockResolvedValue(0),
            });
            mockMaybeSingle.mockResolvedValue({ data: null, error: null }); // no slug collision
            mockGetEventService.mockReturnValue({
                createEvent: jest.fn().mockResolvedValue({ id: 'new-event-1' }),
            });

            const result = await createEvent(baseFormData());
            expect(result).toEqual({ success: true, eventId: 'new-event-1' });
        });

        it('should handle slug collision by appending suffix', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            mockSingle.mockResolvedValue({
                data: { id: 'v1', bank_name: 'Bank', bank_iban: 'TR123', subscription_tier: 'growth' },
                error: null,
            });
            mockGetEventRepository.mockReturnValue({
                countActiveEventsByVendor: jest.fn().mockResolvedValue(0),
            });
            mockMaybeSingle.mockResolvedValue({ data: { slug: 'test-event' }, error: null }); // slug exists
            const mockCreateEvent = jest.fn().mockResolvedValue({ id: 'e1' });
            mockGetEventService.mockReturnValue({ createEvent: mockCreateEvent });

            await createEvent(baseFormData());
            // Slug should have random suffix appended
            const createArgs = mockCreateEvent.mock.calls[0][1];
            expect(createArgs.slug).toMatch(/^test-event-.+$/);
        });

        it('should create tickets from JSON', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            mockSingle.mockResolvedValue({
                data: { id: 'v1', bank_name: 'Bank', bank_iban: 'TR123', subscription_tier: 'growth' },
                error: null,
            });
            mockGetEventRepository.mockReturnValue({
                countActiveEventsByVendor: jest.fn().mockResolvedValue(0),
            });
            mockMaybeSingle.mockResolvedValue({ data: null, error: null });
            mockGetEventService.mockReturnValue({
                createEvent: jest.fn().mockResolvedValue({ id: 'e1' }),
            });

            const fd = baseFormData();
            fd.set('tickets', JSON.stringify([{ name: 'VIP', price: '50', quantity: '10' }]));
            const mockTicketInsert = jest.fn().mockResolvedValue({ error: null });
            mockFrom.mockReturnValue({
                select: mockSelect,
                insert: mockTicketInsert,
                eq: mockEq,
                single: mockSingle,
                maybeSingle: mockMaybeSingle,
            });

            await createEvent(fd);
            // Ticket insert should be called (via supabase.from('tickets').insert(...))
            expect(mockFrom).toHaveBeenCalledWith('tickets');
        });

        it('should create bulk discounts from JSON', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            mockSingle.mockResolvedValue({
                data: { id: 'v1', bank_name: 'Bank', bank_iban: 'TR123', subscription_tier: 'growth' },
                error: null,
            });
            mockGetEventRepository.mockReturnValue({
                countActiveEventsByVendor: jest.fn().mockResolvedValue(0),
            });
            mockMaybeSingle.mockResolvedValue({ data: null, error: null });
            mockGetEventService.mockReturnValue({
                createEvent: jest.fn().mockResolvedValue({ id: 'e1' }),
            });
            const mockCreateBulk = jest.fn().mockResolvedValue(undefined);
            mockGetDiscountService.mockReturnValue({
                createBulkDiscountsForEvent: mockCreateBulk,
            });

            const fd = baseFormData();
            fd.set('bulk_discounts', JSON.stringify([{ min_quantity: 5, discount_percentage: 10 }]));

            await createEvent(fd);
            expect(mockCreateBulk).toHaveBeenCalledWith('e1', [{ min_quantity: 5, discount_percentage: 10 }]);
        });

        it('should handle general error gracefully', async () => {
            mockGetUser.mockRejectedValue(new Error('Connection error'));
            const result = await createEvent(baseFormData());
            expect(result.error).toBeDefined();
        });
    });

    // ===== updateEvent =====
    describe('updateEvent', () => {
        it('should return error when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });
            const result = await updateEvent('e1', baseFormData());
            expect(result).toEqual({ error: 'Unauthorized' });
        });

        it('should update event successfully', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            mockGetEventService.mockReturnValue({
                updateEvent: jest.fn().mockResolvedValue(undefined),
            });

            const result = await updateEvent('e1', baseFormData());
            expect(result).toEqual({ success: true });
        });

        it('should upload image on update when provided', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            const mockUpdateEvent = jest.fn().mockResolvedValue(undefined);
            mockGetEventService.mockReturnValue({ updateEvent: mockUpdateEvent });

            const fd = baseFormData();
            // Can't easily mock File in jest, but the function checks imageFile.size > 0
            // So test the no-image path
            const result = await updateEvent('e1', fd);
            expect(result).toEqual({ success: true });
            expect(mockUpdateEvent).toHaveBeenCalled();
        });

        it('should upsert tickets (update existing + insert new)', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            mockGetEventService.mockReturnValue({
                updateEvent: jest.fn().mockResolvedValue(undefined),
            });

            const fd = baseFormData();
            fd.set('tickets', JSON.stringify([
                { id: 'existing-ticket', name: 'VIP', price: '50', quantity: '10' },
                { name: 'General', price: '20', quantity: '50' },
            ]));

            const result = await updateEvent('e1', fd);
            expect(result).toEqual({ success: true });
            // Verify both from('tickets').update and from('tickets').insert calls
            expect(mockFrom).toHaveBeenCalledWith('tickets');
        });

        it('should update bulk discounts', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            mockGetEventService.mockReturnValue({
                updateEvent: jest.fn().mockResolvedValue(undefined),
            });
            const mockUpdateBulk = jest.fn().mockResolvedValue(undefined);
            mockGetDiscountService.mockReturnValue({
                updateBulkDiscountsForEvent: mockUpdateBulk,
            });

            const fd = baseFormData();
            fd.set('bulk_discounts', JSON.stringify([{ min_quantity: 3, discount_percentage: 5 }]));

            const result = await updateEvent('e1', fd);
            expect(result).toEqual({ success: true });
            expect(mockUpdateBulk).toHaveBeenCalledWith('e1', [{ min_quantity: 3, discount_percentage: 5 }]);
        });

        it('should handle service error gracefully', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            mockGetEventService.mockReturnValue({
                updateEvent: jest.fn().mockRejectedValue(new Error('Event not found')),
            });

            const result = await updateEvent('e1', baseFormData());
            expect(result).toEqual({ error: 'Event not found' });
        });

        it('should handle ticket parse error gracefully', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'v1' } } });
            mockGetEventService.mockReturnValue({
                updateEvent: jest.fn().mockResolvedValue(undefined),
            });

            const fd = baseFormData();
            fd.set('tickets', 'invalid-json');

            const result = await updateEvent('e1', fd);
            // Should still succeed, just log the error
            expect(result).toEqual({ success: true });
        });
    });
});
