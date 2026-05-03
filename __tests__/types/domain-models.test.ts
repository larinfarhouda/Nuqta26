/**
 * Domain Models Tests
 * Tests for mapper functions and computed properties
 */

import { toEventModel, toBookingModel, toVendorModel, toReviewModel } from '@/types/domain-models';

// Helper to create a minimal event row
function mockEventRow(overrides: any = {}) {
    return {
        id: 'evt-1',
        title: 'Test Event',
        slug: 'test-event',
        description: 'A test event',
        event_type: 'workshop',
        status: 'published',
        date: '2099-01-01T10:00:00Z', // Future date
        end_date: null,
        created_at: '2025-01-01T00:00:00Z',
        location_name: 'Istanbul',
        location_lat: 41.0,
        location_long: 29.0,
        city: 'Istanbul',
        district: 'Beyoglu',
        country: 'Turkey',
        location_details: null,
        capacity: 100,
        image_url: null,
        vendor_id: 'vendor-1',
        category_id: 'cat-1',
        is_featured: false,
        featured_at: null,
        is_recurring: false,
        recurrence_type: null,
        recurrence_end_date: null,
        recurrence_days: null,
        prospect_vendor_id: null,
        ...overrides,
    };
}

function mockBookingRow(overrides: any = {}) {
    return {
        id: 'booking-1',
        event_id: 'evt-1',
        vendor_id: 'vendor-1',
        user_id: 'user-1',
        total_amount: 200,
        discount_amount: null,
        status: 'confirmed',
        currency: 'TRY',
        contact_name: 'John',
        contact_email: 'john@test.com',
        contact_phone: '+905551234567',
        payment_method: 'bank_transfer',
        payment_proof_url: null,
        payment_note: null,
        discount_code_id: null,
        reminder_sent: false,
        review_request_sent: false,
        created_at: '2025-06-01T00:00:00Z',
        ...overrides,
    };
}

function mockVendorRow(overrides: any = {}) {
    return {
        id: 'vendor-1',
        business_name: 'Test Vendor',
        slug: 'test-vendor',
        status: 'approved',
        subscription_tier: 'growth',
        company_logo: null,
        bank_name: 'Test Bank',
        bank_account_name: 'Test Account',
        bank_iban: 'TR123456789',
        whatsapp_number: '+905551234567',
        cancellation_policy: 'No refunds',
        return_policy: null,
        created_at: '2025-01-01T00:00:00Z',
        // Fill remaining required fields from database.types
        bio: null,
        description_ar: null,
        description_en: null,
        instagram: null,
        tiktok: null,
        twitter: null,
        website: null,
        is_founder_pricing: false,
        vendor_categories: null,
        background_url: null,
        ...overrides,
    };
}

function mockReviewRow(overrides: any = {}) {
    return {
        id: 'review-1',
        event_id: 'evt-1',
        user_id: 'user-1',
        booking_id: 'booking-1',
        rating: 5,
        comment: 'Great event!',
        is_flagged: false,
        created_at: '2025-06-02T00:00:00Z',
        updated_at: null,
        ...overrides,
    };
}

describe('EventModel', () => {
    it('should map basic fields from row', () => {
        const model = toEventModel(mockEventRow());
        expect(model.id).toBe('evt-1');
        expect(model.title).toBe('Test Event');
        expect(model.slug).toBe('test-event');
        expect(model.eventType).toBe('workshop');
        expect(model.status).toBe('published');
        expect(model.vendorId).toBe('vendor-1');
    });

    it('should convert dates to Date objects', () => {
        const model = toEventModel(mockEventRow());
        expect(model.date).toBeInstanceOf(Date);
        expect(model.createdAt).toBeInstanceOf(Date);
    });

    it('should compute isUpcoming for future events', () => {
        const model = toEventModel(mockEventRow({ date: '2099-12-31T10:00:00Z' }));
        expect(model.isUpcoming).toBe(true);
        expect(model.isPast).toBe(false);
    });

    it('should compute isPast for past events', () => {
        const model = toEventModel(mockEventRow({ date: '2020-01-01T10:00:00Z' }));
        expect(model.isPast).toBe(true);
        expect(model.isUpcoming).toBe(false);
    });

    it('should compute isLive for current events', () => {
        const now = new Date();
        const start = new Date(now.getTime() - 3600000); // 1 hour ago
        const end = new Date(now.getTime() + 3600000); // 1 hour from now
        const model = toEventModel(mockEventRow({
            date: start.toISOString(),
            end_date: end.toISOString(),
        }));
        expect(model.isLive).toBe(true);
    });

    it('should default status to draft', () => {
        const model = toEventModel(mockEventRow({ status: null }));
        expect(model.status).toBe('draft');
    });

    it('should handle null end_date', () => {
        const model = toEventModel(mockEventRow({ end_date: null }));
        expect(model.endDate).toBeNull();
    });

    it('should map featured fields', () => {
        const model = toEventModel(mockEventRow({
            is_featured: true,
            featured_at: '2025-06-01T00:00:00Z',
        }));
        expect(model.isFeatured).toBe(true);
        expect(model.featuredAt).toBeInstanceOf(Date);
    });
});

describe('BookingModel', () => {
    it('should map basic fields', () => {
        const model = toBookingModel(mockBookingRow());
        expect(model.id).toBe('booking-1');
        expect(model.eventId).toBe('evt-1');
        expect(model.totalAmount).toBe(200);
        expect(model.status).toBe('confirmed');
    });

    it('should compute isConfirmed', () => {
        const model = toBookingModel(mockBookingRow({ status: 'confirmed' }));
        expect(model.isConfirmed).toBe(true);
        expect(model.isPending).toBe(false);
        expect(model.canBeDeleted).toBe(false);
    });

    it('should compute isPending for pending_payment', () => {
        const model = toBookingModel(mockBookingRow({ status: 'pending_payment' }));
        expect(model.isPending).toBe(true);
        expect(model.canBeDeleted).toBe(true);
    });

    it('should compute isPending for payment_submitted', () => {
        const model = toBookingModel(mockBookingRow({ status: 'payment_submitted' }));
        expect(model.isPending).toBe(true);
        expect(model.canBeDeleted).toBe(true);
    });

    it('should compute isCancelled', () => {
        const model = toBookingModel(mockBookingRow({ status: 'cancelled' }));
        expect(model.isCancelled).toBe(true);
    });

    it('should compute isCancelled for refunded', () => {
        const model = toBookingModel(mockBookingRow({ status: 'refunded' }));
        expect(model.isCancelled).toBe(true);
    });
});

describe('VendorModel', () => {
    it('should map basic fields', () => {
        const model = toVendorModel(mockVendorRow());
        expect(model.id).toBe('vendor-1');
        expect(model.businessName).toBe('Test Vendor');
        expect(model.subscriptionTier).toBe('growth');
    });

    it('should compute hasBankInfo when both bank_name and bank_iban present', () => {
        const model = toVendorModel(mockVendorRow());
        expect(model.hasBankInfo).toBe(true);
    });

    it('should compute hasBankInfo as false when bank info missing', () => {
        const model = toVendorModel(mockVendorRow({ bank_name: null, bank_iban: null }));
        expect(model.hasBankInfo).toBe(false);
    });

    it('should default tier to starter', () => {
        const model = toVendorModel(mockVendorRow({ subscription_tier: null }));
        expect(model.subscriptionTier).toBe('starter');
    });
});

describe('ReviewModel', () => {
    it('should map basic fields', () => {
        const model = toReviewModel(mockReviewRow());
        expect(model.id).toBe('review-1');
        expect(model.rating).toBe(5);
        expect(model.comment).toBe('Great event!');
        expect(model.isFlagged).toBe(false);
    });

    it('should handle flagged review', () => {
        const model = toReviewModel(mockReviewRow({ is_flagged: true }));
        expect(model.isFlagged).toBe(true);
    });

    it('should handle null comment', () => {
        const model = toReviewModel(mockReviewRow({ comment: null }));
        expect(model.comment).toBeNull();
    });
});
