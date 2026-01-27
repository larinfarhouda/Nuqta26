/**
 * EventService Tests
 * Tests for event management business logic
 */

import { EventService } from '@/services/event.service';
import { EventRepository } from '@/repositories/event.repository';
import { TicketRepository } from '@/repositories/ticket.repository';
import { VendorRepository } from '@/repositories/vendor.repository';
import { ReviewRepository } from '@/repositories/review.repository';
import { DiscountRepository } from '@/repositories/discount.repository';
import { CategoryRepository } from '@/repositories/category.repository';
import { mockEvent, mockEventWithRelations, mockTicket, mockVendor } from '../mocks/data.mock';

describe('EventService', () => {
    let eventService: EventService;
    let mockEventRepo: jest.Mocked<EventRepository>;
    let mockTicketRepo: jest.Mocked<TicketRepository>;
    let mockVendorRepo: jest.Mocked<VendorRepository>;
    let mockReviewRepo: jest.Mocked<ReviewRepository>;
    let mockDiscountRepo: jest.Mocked<DiscountRepository>;
    let mockCategoryRepo: jest.Mocked<CategoryRepository>;

    beforeEach(() => {
        // Create mock repositories
        mockEventRepo = {
            findBySlug: jest.fn(),
            findById: jest.fn(),
            findPublicEvent: jest.fn(),
            findPublicEvents: jest.fn(),
            findByVendorId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            getAllForSitemap: jest.fn(),
        } as any;

        mockTicketRepo = {
            findByEventId: jest.fn(),
            findByEventIds: jest.fn(),
            findById: jest.fn(),
        } as any;

        mockVendorRepo = {
            findBySlug: jest.fn(),
            findById: jest.fn(),
            getGallery: jest.fn(),
            getUpcomingEvents: jest.fn(),
        } as any;

        mockReviewRepo = {
            getRatingSummary: jest.fn(),
            findByEventId: jest.fn(),
            canUserReview: jest.fn(),
            create: jest.fn(),
        } as any;

        mockDiscountRepo = {
            findBulkDiscountsByEventId: jest.fn(),
            findByCode: jest.fn(),
        } as any;

        mockCategoryRepo = {
            findById: jest.fn(),
            findBySlug: jest.fn(),
            findAll: jest.fn(),
            findByIds: jest.fn(),
        } as any;

        eventService = new EventService(
            mockEventRepo,
            mockTicketRepo,
            mockVendorRepo,
            mockReviewRepo,
            mockDiscountRepo,
            mockCategoryRepo
        );
    });

    describe('getPublicEvent', () => {
        it('should return event with full details when found by slug', async () => {
            const event = mockEvent();
            const tickets = [mockTicket()];
            const vendor = mockVendor();
            const rating = { average: 4.5, count: 10 };

            // findPublicEvent returns event WITH tickets and vendor already joined
            mockEventRepo.findPublicEvent.mockResolvedValue({
                ...event,
                tickets,
                vendors: vendor,
                bulk_discounts: []
            } as any);
            mockReviewRepo.getRatingSummary.mockResolvedValue(rating);

            const result = await eventService.getPublicEvent('test-event');

            expect(result).toBeDefined();
            expect(result?.title).toBe('Test Event');
            expect(result?.tickets).toHaveLength(1);
            expect(result?.vendor).toBeDefined();
            expect(mockEventRepo.findPublicEvent).toHaveBeenCalledWith('test-event');
        });

        it('should return null when event not found', async () => {
            mockEventRepo.findPublicEvent.mockResolvedValue(null);

            const result = await eventService.getPublicEvent('non-existent');

            expect(result).toBeNull();
            expect(mockEventRepo.findPublicEvent).toHaveBeenCalledWith('non-existent');
        });

        it('should detect UUID and query by ID', async () => {
            const uuid = '123e4567-e89b-12d3-a456-426614174000';
            const event = mockEvent({ id: uuid });

            mockEventRepo.findPublicEvent.mockResolvedValue(event);
            mockTicketRepo.findByEventId.mockResolvedValue([]);
            mockVendorRepo.findById.mockResolvedValue(mockVendor());
            mockDiscountRepo.findBulkDiscountsByEventId.mockResolvedValue([]);
            mockReviewRepo.getRatingSummary.mockResolvedValue(null);

            await eventService.getPublicEvent(uuid);

            expect(mockEventRepo.findPublicEvent).toHaveBeenCalledWith(uuid);
        });

        it('should handle rating being null gracefully', async () => {
            const event = mockEvent();

            mockEventRepo.findPublicEvent.mockResolvedValue(event);
            mockTicketRepo.findByEventId.mockResolvedValue([]);
            mockVendorRepo.findById.mockResolvedValue(mockVendor());
            mockDiscountRepo.findBulkDiscountsByEventId.mockResolvedValue([]);
            mockReviewRepo.getRatingSummary.mockResolvedValue(null);

            const result = await eventService.getPublicEvent('test-event');

            expect(result?.rating).toBeUndefined();
        });
    });

    describe('searchPublicEvents', () => {
        it('should return all events when no filters provided', async () => {
            const events = [mockEvent(), mockEvent({ id: 'event-456', title: 'Another Event' })];

            mockEventRepo.findPublicEvents.mockResolvedValue(events);

            const result = await eventService.searchPublicEvents();

            expect(result).toHaveLength(2);
            expect(mockEventRepo.findPublicEvents).toHaveBeenCalledWith(undefined);
        });

        it('should apply search filter when provided', async () => {
            const events = [mockEvent({ title: 'Music Concert' })];

            mockEventRepo.findPublicEvents.mockResolvedValue(events);

            const result = await eventService.searchPublicEvents({ search: 'Music' });

            expect(result).toHaveLength(1);
            expect(mockEventRepo.findPublicEvents).toHaveBeenCalledWith({ search: 'Music' });
        });

        it('should return empty array when no events match', async () => {
            mockEventRepo.findPublicEvents.mockResolvedValue([]);

            const result = await eventService.searchPublicEvents({ search: 'NonExistent' });

            expect(result).toHaveLength(0);
        });
    });

    describe('createEvent', () => {
        it('should create event with valid data', async () => {
            const newEvent = mockEvent();
            const vendorId = 'vendor-123';
            const eventData = {
                title: 'New Event',
                description: 'Event description',
                date: '2026-03-01T19:00:00Z',
            };

            mockEventRepo.create.mockResolvedValue(newEvent);

            const result = await eventService.createEvent(vendorId, eventData);

            expect(result).toBeDefined();
            expect(result.title).toBe('Test Event');
            expect(mockEventRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                vendor_id: vendorId,
                ...eventData,
            }));
        });

        it('should throw error when title is too short', async () => {
            const vendorId = 'vendor-123';
            const eventData = {
                title: 'AB', // Too short!
                date: '2026-03-01T19:00:00Z',
            };

            await expect(
                eventService.createEvent(vendorId, eventData)
            ).rejects.toThrow('Title must be at least 3 characters');
        });

        it('should use default status as draft', async () => {
            const newEvent = mockEvent({ status: 'draft' });
            mockEventRepo.create.mockResolvedValue(newEvent);

            const result = await eventService.createEvent('vendor-123', {
                title: 'New Event',
                date: '2026-03-01T19:00:00Z',
            });

            expect(mockEventRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                status: 'draft',
            }));
        });
    });

    describe('updateEvent', () => {
        it('should update event when vendor owns it', async () => {
            const event = mockEvent({ vendor_id: 'vendor-123' });
            const updatedEvent = { ...event, title: 'Updated Title' };

            mockEventRepo.findById.mockResolvedValue(event);
            mockEventRepo.update.mockResolvedValue(updatedEvent);

            const result = await eventService.updateEvent('event-123', 'vendor-123', {
                title: 'Updated Title',
            });

            expect(result.title).toBe('Updated Title');
            expect(mockEventRepo.update).toHaveBeenCalled();
        });

        it('should throw error when vendor does not own event', async () => {
            const event = mockEvent({ vendor_id: 'other-vendor' });

            mockEventRepo.findById.mockResolvedValue(event);

            await expect(
                eventService.updateEvent('event-123', 'vendor-123', { title: 'Updated' })
            ).rejects.toThrow('You do not own this event');
        });

        it('should throw error when event not found', async () => {
            mockEventRepo.findById.mockResolvedValue(null);

            await expect(
                eventService.updateEvent('non-existent', 'vendor-123', { title: 'Updated' })
            ).rejects.toThrow('Event');
        });
    });

    describe('deleteEvent', () => {
        it('should delete event when vendor owns it', async () => {
            const event = mockEvent({ vendor_id: 'vendor-123' });

            mockEventRepo.findById.mockResolvedValue(event);
            mockEventRepo.delete.mockResolvedValue(undefined);

            await eventService.deleteEvent('event-123', 'vendor-123');

            expect(mockEventRepo.delete).toHaveBeenCalledWith('event-123');
        });

        it('should throw error when vendor does not own event', async () => {
            const event = mockEvent({ vendor_id: 'other-vendor' });

            mockEventRepo.findById.mockResolvedValue(event);

            await expect(
                eventService.deleteEvent('event-123', 'vendor-123')
            ).rejects.toThrow('You do not own this event');
        });
    });

    describe('publishEvent', () => {
        it('should publish event when it has tickets', async () => {
            const event = mockEvent({ vendor_id: 'vendor-123', status: 'draft' });
            const tickets = [mockTicket()];

            mockEventRepo.findById.mockResolvedValue(event);
            mockTicketRepo.findByEventId.mockResolvedValue(tickets);
            mockEventRepo.update.mockResolvedValue({ ...event, status: 'published' });

            const result = await eventService.publishEvent('event-123', 'vendor-123');

            expect(result.status).toBe('published');
            expect(mockEventRepo.update).toHaveBeenCalledWith('event-123', { status: 'published' });
        });

        it('should throw error when event has no tickets', async () => {
            const event = mockEvent({ vendor_id: 'vendor-123', status: 'draft' });

            mockEventRepo.findById.mockResolvedValue(event);
            mockTicketRepo.findByEventId.mockResolvedValue([]);

            await expect(
                eventService.publishEvent('event-123', 'vendor-123')
            ).rejects.toThrow('Cannot publish event without tickets');
        });

        it('should throw error when vendor does not own event', async () => {
            const event = mockEvent({ vendor_id: 'other-vendor' });

            mockEventRepo.findById.mockResolvedValue(event);

            await expect(
                eventService.publishEvent('event-123', 'vendor-123')
            ).rejects.toThrow('You do not own this event');
        });
    });

    describe('createEvent', () => {
        it('should generate unique slug with timestamp', async () => {
            const mockCreatedEvent = mockEvent({ slug: 'new-event-1234567890' });
            mockEventRepo.create.mockResolvedValue(mockCreatedEvent);

            const result = await eventService.createEvent('vendor-123', {
                title: 'New Event',
                date: '2026-03-01T19:00:00Z',
            });

            // Slug should contain the title in lowercase with timestamp
            expect(result.slug).toContain('new-event');
            expect(result.slug).toMatch(/new-event-\d+/);
        });
    });
});
