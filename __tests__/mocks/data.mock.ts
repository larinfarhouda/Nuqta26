/**
 * Mock Data Factory
 * Provides realistic test data for all entities
 */

export const mockEvent = (overrides?: Partial<any>) => ({
    id: 'event-123',
    slug: 'test-event',
    title: 'Test Event',
    description: 'This is a test event description',
    date: '2026-02-01T19:00:00Z',
    end_date: '2026-02-01T23:00:00Z',
    location_name: 'Test Venue',
    city: 'Istanbul',
    district: 'Fatih',
    country: 'Turkey',
    image_url: 'https://example.com/event.jpg',
    status: 'published',
    event_type: 'concert',
    capacity: 500,
    location_lat: 41.0082,
    location_long: 28.9784,
    category_id: 'category-123',
    vendor_id: 'vendor-123',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-15T00:00:00Z',
    is_recurring: false,
    recurrence_type: null,
    recurrence_days: null,
    recurrence_end_date: null,
    ...overrides,
});

export const mockTicket = (overrides?: Partial<any>) => ({
    id: 'ticket-123',
    event_id: 'event-123',
    name: 'General Admission',
    price: 100,
    quantity: 200,
    sold: 50,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
});

export const mockVendor = (overrides?: Partial<any>) => ({
    id: 'vendor-123',
    email: 'vendor@example.com',
    business_name: 'Test Venue',
    company_logo: 'https://example.com/logo.jpg',
    slug: 'test-vendor',
    whatsapp_number: '+905551234567',
    website: 'https://testvenue.com',
    category: 'venue',
    instagram: '@testvenue',
    cover_image: 'https://example.com/cover.jpg',
    description_ar: 'وصف تجريبي',
    location_lat: 41.0082,
    location_long: 28.9784,
    bank_name: 'Test Bank',
    bank_account_name: 'Test Venue LLC',
    bank_iban: 'TR123456789',
    ...overrides,
});

export const mockUser = (overrides?: Partial<any>) => ({
    id: 'user-123',
    email: 'user@example.com',
    full_name: 'Test User',
    age: 25,
    gender: 'male',
    country: 'Turkey',
    city: 'Istanbul',
    district: 'Fatih',
    phone: '+905551234567',
    avatar_url: 'https://example.com/avatar.jpg',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
});

export const mockBooking = (overrides?: Partial<any>) => ({
    id: 'booking-123',
    user_id: 'user-123',
    event_id: 'event-123',
    vendor_id: 'vendor-123',
    total_amount: 200,
    discount_amount: 0,
    discount_code_id: null,
    status: 'pending',
    contact_name: 'Test User',
    contact_email: 'user@example.com',
    contact_phone: '+905551234567',
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-01-15T00:00:00Z',
    ...overrides,
});

export const mockReview = (overrides?: Partial<any>) => ({
    id: 'review-123',
    event_id: 'event-123',
    user_id: 'user-123',
    rating: 5,
    comment: 'Great event! Highly recommended.',
    created_at: '2026-01-20T00:00:00Z',
    updated_at: '2026-01-20T00:00:00Z',
    is_flagged: false,
    ...overrides,
});

export const mockDiscount = (overrides?: Partial<any>) => ({
    id: 'discount-123',
    vendor_id: 'vendor-123',
    code: 'TEST10',
    discount_type: 'percentage',
    discount_value: 10,
    is_active: true,
    expiry_date: '2026-12-31T23:59:59Z',
    usage_limit: 100,
    usage_count: 10,
    min_purchase_amount: 50,
    event_id: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
});

export const mockCategory = (overrides?: Partial<any>) => ({
    id: 'category-123',
    name_en: 'Music',
    name_ar: 'موسيقى',
    slug: 'music',
    icon: '🎵',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
});

export const mockBulkDiscount = (overrides?: Partial<any>) => ({
    id: 'bulk-123',
    event_id: 'event-123',
    min_quantity: 5,
    discount_type: 'percentage',
    discount_value: 15,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
});

/**
 * Create mock data with relationships
 */
export const mockEventWithRelations = (overrides?: Partial<any>) => ({
    ...mockEvent(overrides),
    tickets: [mockTicket(), mockTicket({ id: 'ticket-456', name: 'VIP', price: 200 })],
    vendor: mockVendor(),
    bulk_discounts: [mockBulkDiscount()],
    rating: {
        average: 4.5,
        count: 10,
    },
});

export const mockBookingWithRelations = (overrides?: Partial<any>) => ({
    ...mockBooking(overrides),
    events: mockEvent(),
    profiles: mockUser(),
});
