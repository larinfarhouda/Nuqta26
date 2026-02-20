/**
 * VendorRepository Tests
 * Tests for vendor database operations
 */

import { VendorRepository } from '@/repositories/vendor.repository';
import { createMockSupabaseClient } from '../mocks/supabase.mock';
import { mockVendor } from '../mocks/data.mock';

describe('VendorRepository', () => {
    let vendorRepo: VendorRepository;
    let mockClient: ReturnType<typeof createMockSupabaseClient>;

    beforeEach(() => {
        mockClient = createMockSupabaseClient();
        vendorRepo = new VendorRepository(mockClient as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findBySlug', () => {
        it('should return vendor when found', async () => {
            const vendor = mockVendor();
            mockClient._mocks.single.mockResolvedValueOnce({ data: vendor, error: null });

            const result = await vendorRepo.findBySlug('test-vendor');

            expect(result).toEqual(vendor);
            expect(mockClient.from).toHaveBeenCalledWith('vendors');
            expect(mockClient._mocks.eq).toHaveBeenCalledWith('slug', 'test-vendor');
        });

        it('should return null when not found', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
            });

            const result = await vendorRepo.findBySlug('non-existent');

            expect(result).toBeNull();
        });

        it('should throw DatabaseError on DB error', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { code: '500', message: 'Server error' },
            });

            await expect(vendorRepo.findBySlug('test')).rejects.toThrow();
        });
    });

    describe('findById', () => {
        it('should return vendor when found', async () => {
            const vendor = mockVendor();
            mockClient._mocks.single.mockResolvedValueOnce({ data: vendor, error: null });

            const result = await vendorRepo.findById('vendor-123');

            expect(result).toEqual(vendor);
            expect(mockClient._mocks.eq).toHaveBeenCalledWith('id', 'vendor-123');
        });

        it('should return null when not found', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
            });

            const result = await vendorRepo.findById('bad-id');

            expect(result).toBeNull();
        });
    });

    describe('getGallery', () => {
        it('should return gallery images', async () => {
            const gallery = [{ id: 'g1', image_url: 'https://example.com/1.jpg' }];
            mockClient._mocks.order.mockResolvedValueOnce({ data: gallery, error: null });

            const result = await vendorRepo.getGallery('vendor-123');

            expect(result).toEqual(gallery);
            expect(mockClient.from).toHaveBeenCalledWith('vendor_gallery');
        });

        it('should return empty array when no images', async () => {
            mockClient._mocks.order.mockResolvedValueOnce({ data: null, error: null });

            const result = await vendorRepo.getGallery('vendor-123');

            expect(result).toEqual([]);
        });

        it('should throw on error', async () => {
            mockClient._mocks.order.mockResolvedValueOnce({
                data: null,
                error: { message: 'DB error' },
            });

            await expect(vendorRepo.getGallery('vendor-123')).rejects.toThrow();
        });
    });

    describe('getUpcomingEvents', () => {
        it('should return upcoming published events', async () => {
            const events = [
                { id: 'e1', slug: 's1', title: 'Event 1', date: '2027-01-01T00:00:00Z' },
            ];
            mockClient._mocks.order.mockResolvedValueOnce({ data: events, error: null });

            const result = await vendorRepo.getUpcomingEvents('vendor-123');

            expect(result).toEqual(events);
            expect(mockClient.from).toHaveBeenCalledWith('events');
            expect(mockClient._mocks.eq).toHaveBeenCalledWith('vendor_id', 'vendor-123');
            expect(mockClient._mocks.eq).toHaveBeenCalledWith('status', 'published');
        });

        it('should return empty array when no upcoming events', async () => {
            mockClient._mocks.order.mockResolvedValueOnce({ data: null, error: null });

            const result = await vendorRepo.getUpcomingEvents('vendor-123');

            expect(result).toEqual([]);
        });
    });
});
