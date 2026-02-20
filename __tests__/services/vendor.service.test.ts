/**
 * VendorService Tests
 * Tests for vendor profile and event listing business logic
 */

import { VendorService } from '@/services/vendor.service';
import { VendorRepository } from '@/repositories/vendor.repository';
import { TicketRepository } from '@/repositories/ticket.repository';
import { CategoryRepository } from '@/repositories/category.repository';
import { mockVendor, mockEvent, mockTicket, mockCategory } from '../mocks/data.mock';

describe('VendorService', () => {
    let vendorService: VendorService;
    let mockVendorRepo: jest.Mocked<VendorRepository>;
    let mockTicketRepo: jest.Mocked<TicketRepository>;
    let mockCategoryRepo: jest.Mocked<CategoryRepository>;

    beforeEach(() => {
        mockVendorRepo = {
            findBySlug: jest.fn(),
            getGallery: jest.fn(),
            getUpcomingEvents: jest.fn(),
        } as any;

        mockTicketRepo = {
            findByEventIds: jest.fn(),
        } as any;

        mockCategoryRepo = {
            findByIds: jest.fn(),
        } as any;

        vendorService = new VendorService(mockVendorRepo, mockTicketRepo, mockCategoryRepo);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getPublicVendor', () => {
        it('should return full vendor DTO when vendor exists', async () => {
            const vendor = mockVendor();
            const gallery = [{ id: 'g1', image_url: 'https://example.com/1.jpg' }];
            const events = [mockEvent({ vendor_id: vendor.id })];
            const tickets = [mockTicket({ event_id: events[0].id })];
            const categories = [mockCategory()];

            mockVendorRepo.findBySlug.mockResolvedValue(vendor);
            mockVendorRepo.getGallery.mockResolvedValue(gallery);
            mockVendorRepo.getUpcomingEvents.mockResolvedValue(events);
            mockTicketRepo.findByEventIds.mockResolvedValue(tickets);
            mockCategoryRepo.findByIds.mockResolvedValue(categories);

            const result = await vendorService.getPublicVendor('test-vendor');

            expect(result).not.toBeNull();
            expect(result!.id).toBe(vendor.id);
            expect(result!.slug).toBe(vendor.slug);
            expect(result!.business_name).toBe(vendor.business_name);
            expect(result!.gallery).toEqual(gallery);
            expect(result!.events).toHaveLength(1);
            expect(mockVendorRepo.findBySlug).toHaveBeenCalledWith('test-vendor');
        });

        it('should return null when vendor not found', async () => {
            mockVendorRepo.findBySlug.mockResolvedValue(null);

            const result = await vendorService.getPublicVendor('non-existent');

            expect(result).toBeNull();
            expect(mockVendorRepo.getGallery).not.toHaveBeenCalled();
        });

        it('should return vendor with empty events when no upcoming events', async () => {
            const vendor = mockVendor();
            mockVendorRepo.findBySlug.mockResolvedValue(vendor);
            mockVendorRepo.getGallery.mockResolvedValue([]);
            mockVendorRepo.getUpcomingEvents.mockResolvedValue([]);

            const result = await vendorService.getPublicVendor('test-vendor');

            expect(result).not.toBeNull();
            expect(result!.events).toHaveLength(0);
            expect(mockTicketRepo.findByEventIds).not.toHaveBeenCalled();
        });

        it('should handle events without categories', async () => {
            const vendor = mockVendor();
            const events = [mockEvent({ category_id: null })];

            mockVendorRepo.findBySlug.mockResolvedValue(vendor);
            mockVendorRepo.getGallery.mockResolvedValue([]);
            mockVendorRepo.getUpcomingEvents.mockResolvedValue(events);
            mockTicketRepo.findByEventIds.mockResolvedValue([]);

            const result = await vendorService.getPublicVendor('test-vendor');

            expect(result).not.toBeNull();
            expect(result!.events[0].category.name_en).toBe('Event');
            expect(mockCategoryRepo.findByIds).not.toHaveBeenCalled();
        });

        it('should calculate minimum ticket price for events', async () => {
            const vendor = mockVendor();
            const events = [mockEvent()];
            const tickets = [
                mockTicket({ event_id: 'event-123', price: 200 }),
                mockTicket({ id: 'ticket-456', event_id: 'event-123', price: 50 }),
            ];

            mockVendorRepo.findBySlug.mockResolvedValue(vendor);
            mockVendorRepo.getGallery.mockResolvedValue([]);
            mockVendorRepo.getUpcomingEvents.mockResolvedValue(events);
            mockTicketRepo.findByEventIds.mockResolvedValue(tickets);
            mockCategoryRepo.findByIds.mockResolvedValue([mockCategory()]);

            const result = await vendorService.getPublicVendor('test-vendor');

            expect(result!.events[0].price).toBe(50);
        });

        it('should return price 0 when event has no tickets', async () => {
            const vendor = mockVendor();
            const events = [mockEvent()];

            mockVendorRepo.findBySlug.mockResolvedValue(vendor);
            mockVendorRepo.getGallery.mockResolvedValue([]);
            mockVendorRepo.getUpcomingEvents.mockResolvedValue(events);
            mockTicketRepo.findByEventIds.mockResolvedValue([]);
            mockCategoryRepo.findByIds.mockResolvedValue([mockCategory()]);

            const result = await vendorService.getPublicVendor('test-vendor');

            expect(result!.events[0].price).toBe(0);
        });
    });
});
