/**
 * @jest-environment node
 */

/**
 * Vendor Repository — Integration Tests
 *
 * Validates that all Supabase queries compile and execute against the real schema.
 * These are READ-ONLY tests — no inserts or deletes.
 */

import { VendorRepository } from '@/repositories/vendor.repository';
import { describeIntegration, getIntegrationClient } from '../helpers/supabase-integration.setup';

describeIntegration('VendorRepository (Integration)', () => {
    let vendorRepo: VendorRepository;

    beforeAll(() => {
        const client = getIntegrationClient();
        vendorRepo = new VendorRepository(client as any);
    });

    describe('findBySlug', () => {
        it('should execute without schema errors', async () => {
            const result = await vendorRepo.findBySlug('non-existent-vendor-xyz');
            expect(result).toBeNull();
        });
    });

    describe('findById', () => {
        it('should execute without schema errors', async () => {
            const result = await vendorRepo.findById('00000000-0000-0000-0000-000000000000');
            expect(result).toBeNull();
        });
    });

    describe('getGallery', () => {
        it('should execute vendor_gallery query without schema errors', async () => {
            const result = await vendorRepo.getGallery('00000000-0000-0000-0000-000000000000');
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('getUpcomingEvents', () => {
        it('should execute the events select with specific columns without errors', async () => {
            const result = await vendorRepo.getUpcomingEvents('00000000-0000-0000-0000-000000000000');
            expect(Array.isArray(result)).toBe(true);
        });
    });
});
