/**
 * @jest-environment node
 */

/**
 * Event Repository — Integration Tests
 *
 * Validates that all Supabase queries compile and execute against the real schema.
 * These are READ-ONLY tests — no inserts or deletes.
 *
 * Catches schema-level bugs like wrong column names in select strings,
 * broken joins (e.g., vendors, tickets, bulk_discounts), and missing tables.
 */

import { EventRepository } from '@/repositories/event.repository';
import { describeIntegration, getIntegrationClient } from '../helpers/supabase-integration.setup';

describeIntegration('EventRepository (Integration)', () => {
    let eventRepo: EventRepository;

    beforeAll(() => {
        const client = getIntegrationClient();
        eventRepo = new EventRepository(client as any);
    });

    describe('findBySlug', () => {
        it('should execute without schema errors', async () => {
            const result = await eventRepo.findBySlug('non-existent-slug-xyz');
            expect(result).toBeNull();
        });
    });

    describe('findById', () => {
        it('should execute without schema errors', async () => {
            const result = await eventRepo.findById('00000000-0000-0000-0000-000000000000');
            expect(result).toBeNull();
        });
    });

    describe('findPublicEvent', () => {
        it('should execute the complex join (tickets, vendors, bulk_discounts) without schema errors', async () => {
            // This is the most complex select string — joins 3 tables
            const result = await eventRepo.findPublicEvent('non-existent-slug-xyz');
            expect(result).toBeNull();
        });
    });

    describe('findPublicEvents', () => {
        it('should execute the RPC query without errors', async () => {
            const result = await eventRepo.findPublicEvents({ search: '__nonexistent__' });
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('findByVendorId', () => {
        it('should execute without schema errors', async () => {
            const result = await eventRepo.findByVendorId('00000000-0000-0000-0000-000000000000');
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('getAllForSitemap', () => {
        it('should execute select with specific columns without errors', async () => {
            const result = await eventRepo.getAllForSitemap();
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('countActiveEventsByVendor', () => {
        it('should execute count query without errors', async () => {
            const result = await eventRepo.countActiveEventsByVendor('00000000-0000-0000-0000-000000000000');
            expect(typeof result).toBe('number');
        });
    });
});
