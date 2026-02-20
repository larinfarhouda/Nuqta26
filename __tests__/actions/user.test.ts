/**
 * User Actions Server Action Tests
 * Tests for toggleFavoriteEvent, getUserFavorites, getUserBookings, getUserFavoriteIds,
 * updateUserProfile, deleteUnpaidBooking, submitPaymentProof, isEventFavorite
 */

import { toggleFavoriteEvent, getUserFavorites, getUserBookings, getUserFavoriteIds, updateUserProfile, deleteUnpaidBooking, submitPaymentProof, isEventFavorite } from '@/actions/user';

jest.mock('@/utils/supabase/server', () => ({
    createClient: jest.fn(),
}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/track-activity', () => ({ trackActivity: jest.fn() }));

const mockGetUser = jest.fn();
const mockGetUserService = jest.fn();
const mockGetBookingService = jest.fn();
const mockGetNotificationService = jest.fn();

jest.mock('@/services/service-factory', () => ({
    ServiceFactory: jest.fn().mockImplementation(() => ({
        getUserService: mockGetUserService,
        getBookingService: mockGetBookingService,
        getNotificationService: mockGetNotificationService,
        userRepo: { isFavorite: jest.fn() },
    })),
}));

import { createClient } from '@/utils/supabase/server';
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('User Actions', () => {
    let mockFrom: jest.Mock;
    let mockSingle: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });

        const chainable: any = {};
        chainable.select = jest.fn().mockReturnValue(chainable);
        chainable.update = jest.fn().mockReturnValue(chainable);
        chainable.insert = jest.fn().mockReturnValue(chainable);
        chainable.eq = jest.fn().mockReturnValue(chainable);
        chainable.single = mockSingle;
        chainable.then = undefined; // prevent accidental await on the chain

        mockFrom = jest.fn().mockReturnValue(chainable);

        mockCreateClient.mockResolvedValue({
            auth: { getUser: mockGetUser },
            from: mockFrom,
        } as any);
    });

    // ===== toggleFavoriteEvent =====
    describe('toggleFavoriteEvent', () => {
        it('should toggle favorite and return success', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
            mockGetUserService.mockReturnValue({
                toggleFavorite: jest.fn().mockResolvedValue(undefined),
            });

            const result = await toggleFavoriteEvent('e1', false);
            expect(result).toEqual({ success: true });
        });

        it('should return error when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });
            const result = await toggleFavoriteEvent('e1', false);
            expect(result).toEqual({ error: 'Unauthorized' });
        });

        it('should return error on failure', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
            mockGetUserService.mockReturnValue({
                toggleFavorite: jest.fn().mockRejectedValue(new Error('fail')),
            });
            const result = await toggleFavoriteEvent('e1', false);
            expect(result.error).toBe('fail');
        });
    });

    // ===== getUserFavorites =====
    describe('getUserFavorites', () => {
        it('should return favorites for authenticated user', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
            const favs = [{ event: { id: 'e1' } }, { event: { id: 'e2' } }];
            mockGetUserService.mockReturnValue({
                getFavorites: jest.fn().mockResolvedValue(favs),
            });

            const result = await getUserFavorites();
            expect(result).toEqual([{ id: 'e1' }, { id: 'e2' }]);
        });

        it('should return empty array when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });
            const result = await getUserFavorites();
            expect(result).toEqual([]);
        });
    });

    // ===== getUserBookings =====
    describe('getUserBookings', () => {
        it('should return bookings for authenticated user', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
            const bookings = [{ id: 'b1' }];
            mockGetBookingService.mockReturnValue({
                getUserBookings: jest.fn().mockResolvedValue(bookings),
            });

            const result = await getUserBookings();
            expect(result).toEqual(bookings);
        });

        it('should return empty array when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });
            const result = await getUserBookings();
            expect(result).toEqual([]);
        });
    });

    // ===== getUserFavoriteIds =====
    describe('getUserFavoriteIds', () => {
        it('should return favorite IDs', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
            mockGetUserService.mockReturnValue({
                getFavoriteIds: jest.fn().mockResolvedValue(['e1', 'e2']),
            });

            const result = await getUserFavoriteIds();
            expect(result).toEqual(['e1', 'e2']);
        });

        it('should return empty array for unauthenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });
            const result = await getUserFavoriteIds();
            expect(result).toEqual([]);
        });
    });

    // ===== updateUserProfile =====
    describe('updateUserProfile', () => {
        it('should update profile and return success', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
            mockGetUserService.mockReturnValue({
                updateProfile: jest.fn().mockResolvedValue(undefined),
            });

            const result = await updateUserProfile({ full_name: 'John Doe' });
            expect(result).toEqual({ success: true });
        });

        it('should return error when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });
            const result = await updateUserProfile({ full_name: 'John' });
            expect(result).toEqual({ error: 'Unauthorized' });
        });

        it('should return error on failure', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
            mockGetUserService.mockReturnValue({
                updateProfile: jest.fn().mockRejectedValue(new Error('Validation failed')),
            });
            const result = await updateUserProfile({ full_name: '' });
            expect(result.error).toBe('Validation failed');
        });
    });

    // ===== deleteUnpaidBooking =====
    describe('deleteUnpaidBooking', () => {
        it('should delete and return success', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
            mockGetBookingService.mockReturnValue({
                deleteUnpaidBooking: jest.fn().mockResolvedValue(true),
            });

            const result = await deleteUnpaidBooking('b1');
            expect(result).toEqual({ success: true });
        });

        it('should return error when deletion fails', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
            mockGetBookingService.mockReturnValue({
                deleteUnpaidBooking: jest.fn().mockResolvedValue(false),
            });

            const result = await deleteUnpaidBooking('b1');
            expect(result.error).toContain('unpaid');
        });

        it('should return error when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });
            const result = await deleteUnpaidBooking('b1');
            expect(result).toEqual({ error: 'Unauthorized' });
        });
    });

    // ===== submitPaymentProof =====
    describe('submitPaymentProof', () => {
        // Helper: creates a thenable chain that supports .eq().eq() and resolves when awaited
        function createThenableChain(resolveWith: any) {
            const chain: any = {};
            chain.eq = jest.fn().mockReturnValue(chain);
            chain.then = (resolve: any) => resolve(resolveWith);
            return chain;
        }

        it('should return error when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });
            const result = await submitPaymentProof('b1', 'http://proof.jpg');
            expect(result).toEqual({ error: 'Unauthorized' });
        });

        it('should submit payment proof successfully', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'test@example.com' } } });

            const updateChain = createThenableChain({ error: null });

            const selectChain: any = {};
            selectChain.eq = jest.fn().mockReturnValue(selectChain);
            selectChain.single = jest.fn()
                .mockResolvedValueOnce({
                    data: { id: 'b1', total_amount: 100, events: { title: 'Test Event', date: '2027-01-15', vendor_id: 'v1' } },
                    error: null,
                })
                .mockResolvedValueOnce({
                    data: { full_name: 'Test User' },
                    error: null,
                });
            selectChain.select = jest.fn().mockReturnValue(selectChain);

            mockFrom.mockImplementation((table: string) => {
                if (table === 'bookings') {
                    return {
                        update: jest.fn().mockReturnValue(updateChain),
                        select: jest.fn().mockReturnValue(selectChain),
                        eq: selectChain.eq,
                        single: selectChain.single,
                    };
                }
                return {
                    select: jest.fn().mockReturnValue(selectChain),
                    eq: selectChain.eq,
                    single: selectChain.single,
                };
            });

            mockGetNotificationService.mockReturnValue({
                sendBookingConfirmation: jest.fn().mockResolvedValue(undefined),
            });

            const result = await submitPaymentProof('b1', 'http://proof.jpg');
            expect(result).toEqual({ success: true });
        });

        it('should return error when update fails', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });

            const updateChain = createThenableChain({ error: { message: 'Update failed' } });

            mockFrom.mockReturnValue({
                update: jest.fn().mockReturnValue(updateChain),
            });

            const result = await submitPaymentProof('b1', 'http://proof.jpg');
            expect(result).toEqual({ error: 'Failed to submit payment proof' });
        });

        it('should succeed even when email sending fails', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'test@example.com' } } });

            const updateChain = createThenableChain({ error: null });

            const selectChain: any = {};
            selectChain.eq = jest.fn().mockReturnValue(selectChain);
            selectChain.single = jest.fn()
                .mockResolvedValueOnce({
                    data: { id: 'b1', total_amount: 100, events: { title: 'Test', date: '2027-01-15', vendor_id: 'v1' } },
                    error: null,
                })
                .mockResolvedValueOnce({ data: { full_name: 'User' }, error: null });
            selectChain.select = jest.fn().mockReturnValue(selectChain);

            mockFrom.mockImplementation((table: string) => {
                if (table === 'bookings') {
                    return {
                        update: jest.fn().mockReturnValue(updateChain),
                        select: jest.fn().mockReturnValue(selectChain),
                        eq: selectChain.eq,
                        single: selectChain.single,
                    };
                }
                return {
                    select: jest.fn().mockReturnValue(selectChain),
                    eq: selectChain.eq,
                    single: selectChain.single,
                };
            });

            mockGetNotificationService.mockReturnValue({
                sendBookingConfirmation: jest.fn().mockRejectedValue(new Error('Email failed')),
            });

            const result = await submitPaymentProof('b1', 'http://proof.jpg');
            expect(result).toEqual({ success: true });
        });

        it('should return error when booking not found after update', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });

            const updateChain = createThenableChain({ error: null });

            const selectChain: any = {};
            selectChain.eq = jest.fn().mockReturnValue(selectChain);
            selectChain.single = jest.fn().mockResolvedValue({ data: null, error: null });
            selectChain.select = jest.fn().mockReturnValue(selectChain);

            mockFrom.mockImplementation(() => ({
                update: jest.fn().mockReturnValue(updateChain),
                select: jest.fn().mockReturnValue(selectChain),
                eq: selectChain.eq,
                single: selectChain.single,
            }));

            const result = await submitPaymentProof('b1', 'http://proof.jpg');
            expect(result).toEqual({ error: 'Booking not found' });
        });
    });

    // ===== isEventFavorite =====
    describe('isEventFavorite', () => {
        it('should return false when not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });
            const result = await isEventFavorite('e1');
            expect(result).toBe(false);
        });

        it('should return false on error', async () => {
            mockGetUser.mockRejectedValue(new Error('fail'));
            const result = await isEventFavorite('e1');
            expect(result).toBe(false);
        });
    });
});
