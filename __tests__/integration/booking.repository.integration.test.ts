/**
 * @jest-environment node
 */

/**
 * Booking Repository — Integration Tests
 * 
 * Validates that all Supabase queries compile and execute against the real schema.
 * These are READ-ONLY tests that query existing data — no inserts or deletes.
 * 
 * The main goal is to catch schema-level bugs like:
 * - Bad join syntax (e.g., profiles!user_id when no FK exists)
 * - Wrong column names in select strings
 * - Missing table relationships
 */

import { BookingRepository } from '@/repositories/booking.repository';
import { describeIntegration, getIntegrationClient } from '../helpers/supabase-integration.setup';

describeIntegration('BookingRepository (Integration)', () => {
    let bookingRepo: BookingRepository;

    beforeAll(() => {
        const client = getIntegrationClient();
        bookingRepo = new BookingRepository(client as any);
    });

    describe('findByVendorId', () => {
        it('should execute without schema errors', async () => {
            // Use a non-existent vendor ID — we just want to verify the query compiles
            const result = await bookingRepo.findByVendorId('00000000-0000-0000-0000-000000000000');
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('findByIdWithDetails', () => {
        it('should execute the events + profiles join without schema errors', async () => {
            // This is the exact query that was broken before the fix.
            // It should return null for a non-existent ID, NOT throw a schema error.
            const result = await bookingRepo.findByIdWithDetails('00000000-0000-0000-0000-000000000000');
            expect(result).toBeNull();
        });
    });

    describe('findByUserId', () => {
        it('should execute the event+vendor join without schema errors', async () => {
            const result = await bookingRepo.findByUserId('00000000-0000-0000-0000-000000000000');
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('getVendorCustomers', () => {
        it('should execute the events join without schema errors', async () => {
            const result = await bookingRepo.getVendorCustomers('00000000-0000-0000-0000-000000000000');
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('getPendingCount', () => {
        it('should execute count query without errors', async () => {
            const result = await bookingRepo.getPendingCount('00000000-0000-0000-0000-000000000000');
            expect(typeof result).toBe('number');
        });
    });

    describe('getConfirmedBookings', () => {
        it('should execute select query without errors', async () => {
            const result = await bookingRepo.getConfirmedBookings('00000000-0000-0000-0000-000000000000');
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('getBookingItemsCount', () => {
        it('should execute count query on booking_items without errors', async () => {
            const result = await bookingRepo.getBookingItemsCount('00000000-0000-0000-0000-000000000000');
            expect(typeof result).toBe('number');
        });
    });

    describe('findPendingBookingByUserAndEvent', () => {
        it('should execute filtered query without errors', async () => {
            const result = await bookingRepo.findPendingBookingByUserAndEvent(
                '00000000-0000-0000-0000-000000000000',
                '00000000-0000-0000-0000-000000000000'
            );
            expect(result).toBeNull();
        });
    });
});
