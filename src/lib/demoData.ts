/**
 * Demo Data Generator for Vendor Dashboard
 * Provides realistic mock data for demo mode without database interaction
 */

export const DEMO_VENDOR_ID = 'demo-vendor-00000000-0000-0000-0000-000000000001';
export const DEMO_VENDOR_SLUG = 'istanbul-cultural-events';
export const DEMO_USER_ID = 'demo-user-00000000-0000-0000-0000-000000000001';

// Demo Vendor Profile
export const getDemoVendorData = () => ({
    id: DEMO_VENDOR_ID,
    business_name: 'Istanbul Cultural Events',
    company_logo: 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=400&h=400&fit=crop',
    cover_image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&h=400&fit=crop',
    phone: '+90 555 123 4567',
    whatsapp_number: '+90 555 123 4567',
    slug: DEMO_VENDOR_SLUG,
    bank_name: 'İş Bankası',
    bank_account_name: 'Istanbul Cultural Events Ltd.',
    bank_iban: 'TR33 0006 1005 1978 6457 8413 26',
    category: 'cultural',
    description_ar: 'نحن متخصصون في تنظيم الفعاليات الثقافية الفريدة في اسطنبول، بما في ذلك الجولات التاريخية وورش العمل الفنية والأمسيات الموسيقية التقليدية.',
    location_lat: 41.0082,
    location_long: 28.9784,
    district: 'istanbul',
    subscription_tier: 'professional',
    platform_signup_date: '2025-06-15T00:00:00Z',
    created_at: '2025-06-15T10:00:00Z',
    updated_at: '2026-01-28T14:30:00Z'
});

// Demo Events
export const getDemoEvents = () => [
    {
        id: 'demo-event-001',
        vendor_id: DEMO_VENDOR_ID,
        title: 'ورشة القهوة التركية التقليدية',
        slug: 'traditional-turkish-coffee-workshop',
        description: 'Learn the art of making authentic Turkish coffee from master baristas. Includes tasting session and cultural storytelling.',
        image_url: 'https://images.unsplash.com/photo-1514066558159-fc8c737ef259?w=800&h=600&fit=crop',
        date: '2026-02-15T14:00:00Z',
        end_date: '2026-02-15T16:00:00Z',
        location_name: 'Sultanahmet Cultural Center',
        location_lat: 41.0082,
        location_long: 28.9784,
        district: 'istanbul',
        city: 'Istanbul',
        country: 'Turkey',
        capacity: 30,
        status: 'published',
        event_type: 'cultural',
        category_id: null,
        is_recurring: false,
        created_at: '2026-01-10T09:00:00Z',
        tickets: [
            { id: 'ticket-001-1', event_id: 'demo-event-001', name: 'General Admission', price: 250, quantity: 30, sold: 18 }
        ],
        bookings: [
            { count: 18 }
        ]
    },
    {
        id: 'demo-event-002',
        vendor_id: DEMO_VENDOR_ID,
        title: 'أمسية الموسيقى التقليدية: الصوفية والكلاسيكية',
        slug: 'traditional-music-evening-sufi-classical',
        description: 'An enchanting evening of traditional Turkish Sufi and classical music performances.',
        image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=600&fit=crop',
        date: '2026-02-25T19:00:00Z',
        end_date: '2026-02-25T21:30:00Z',
        location_name: 'Hodjapasha Cultural Center',
        location_lat: 41.0115,
        location_long: 28.9815,
        district: 'istanbul',
        city: 'Istanbul',
        country: 'Turkey',
        capacity: 100,
        status: 'published',
        event_type: 'entertainment',
        category_id: null,
        is_recurring: false,
        created_at: '2026-01-08T16:00:00Z',
        tickets: [
            { id: 'ticket-002-1', event_id: 'demo-event-002', name: 'Standard Seating', price: 180, quantity: 70, sold: 25 },
            { id: 'ticket-002-2', event_id: 'demo-event-002', name: 'VIP Front Row', price: 300, quantity: 30, sold: 8 }
        ],
        bookings: [
            { count: 33 }
        ]
    },
    {
        id: 'demo-event-003',
        vendor_id: DEMO_VENDOR_ID,
        title: 'جولة تاريخية في البازار الكبير',
        slug: 'grand-bazaar-historical-walking-tour',
        description: 'Explore the fascinating history and hidden gems of the world-famous Grand Bazaar.',
        image_url: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=800&h=600&fit=crop',
        date: '2026-02-10T11:00:00Z',
        end_date: '2026-02-10T13:00:00Z',
        location_name: 'Grand Bazaar Main Entrance',
        location_lat: 41.0108,
        location_long: 28.9680,
        district: 'istanbul',
        city: 'Istanbul',
        country: 'Turkey',
        capacity: 25,
        status: 'draft',
        event_type: 'cultural',
        category_id: null,
        is_recurring: false,
        created_at: '2026-01-20T10:00:00Z',
        tickets: [
            { id: 'ticket-003-1', event_id: 'demo-event-003', name: 'Tour Ticket', price: 200, quantity: 25, sold: 0 }
        ],
        bookings: [
            { count: 0 }
        ]
    }
];

// Demo Bookings - Fixed to use 'profiles' instead of 'user' and 'events' for proper display
export const getDemoBookings = () => [
    {
        id: 'booking-001',
        user_id: 'user-001',
        event_id: 'demo-event-001',
        vendor_id: DEMO_VENDOR_ID,
        status: 'confirmed',
        total_amount: 500,
        discount_amount: 0,
        payment_method: 'bank_transfer',
        payment_proof_url: 'https://example.com/proof1.jpg',
        created_at: '2026-01-28T14:30:00Z',
        booking_items_count: 2,
        profiles: { full_name: 'Ahmed Hassan', email: 'ahmed.hassan@example.com', phone: '+90 555 111 2233' },
        events: { title: 'ورشة القهوة التركية التقليدية', date: '2026-02-15T14:00:00Z' },
        items: [
            { id: 'item-001-1', attendee_name: 'Ahmed Hassan', attendee_email: 'ahmed.hassan@example.com', price_at_booking: 250 },
            { id: 'item-001-2', attendee_name: 'Sara Hassan', attendee_email: 'sara.h@example.com', price_at_booking: 250 }
        ]
    },
    {
        id: 'booking-002',
        user_id: 'user-002',
        event_id: 'demo-event-002',
        vendor_id: DEMO_VENDOR_ID,
        status: 'payment_submitted',
        total_amount: 350,
        discount_amount: 0,
        payment_method: 'bank_transfer',
        payment_proof_url: 'https://example.com/proof2.jpg',
        payment_note: 'Transferred from İş Bankası',
        created_at: '2026-01-30T13:20:00Z',
        booking_items_count: 2,
        profiles: { full_name: 'Fatima Yilmaz', email: 'fatima.y@example.com', phone: '+90 555 222 3344' },
        events: { title: 'أمسية الموسيقى التقليدية: الصوفية والكلاسيكية', date: '2026-02-25T19:00:00Z' },
        items: [
            { id: 'item-002-1', attendee_name: 'Fatima Yilmaz', attendee_email: 'fatima.y@example.com', price_at_booking: 180 },
            { id: 'item-002-2', attendee_name: 'Mehmet Yilmaz', attendee_email: 'mehmet.y@example.com', price_at_booking: 180 }
        ]
    },
    {
        id: 'booking-003',
        user_id: 'user-003',
        event_id: 'demo-event-001',
        vendor_id: DEMO_VENDOR_ID,
        status: 'pending_payment',
        total_amount: 250,
        discount_amount: 0,
        payment_method: 'bank_transfer',
        created_at: '2026-02-01T09:15:00Z',
        booking_items_count: 1,
        profiles: { full_name: 'Omar Demir', email: 'omar.demir@example.com', phone: '+90 555 333 4455' },
        events: { title: 'ورشة القهوة التركية التقليدية', date: '2026-02-15T14:00:00Z' },
        items: [
            { id: 'item-003-1', attendee_name: 'Omar Demir', attendee_email: 'omar.demir@example.com', price_at_booking: 250 }
        ]
    }
];

// Demo Customers - Reduced to 3
export const getDemoCustomers = () => [
    { id: 'user-001', full_name: 'Ahmed Hassan', email: 'ahmed.hassan@example.com', phone: '+90 555 111 2233', total_bookings: 3, total_spent: 1200 },
    { id: 'user-002', full_name: 'Fatima Yilmaz', email: 'fatima.y@example.com', phone: '+90 555 222 3344', total_bookings: 2, total_spent: 700 },
    { id: 'user-003', full_name: 'Omar Demir', email: 'omar.demir@example.com', phone: '+90 555 333 4455', total_bookings: 1, total_spent: 250 }
];

// Demo Gallery Images - Reduced to 3
export const getDemoGallery = () => [
    { id: 'gallery-001', vendor_id: DEMO_VENDOR_ID, image_url: 'https://images.unsplash.com/photo-1578926314433-e2789279f4aa?w=800&h=600&fit=crop', created_at: '2026-01-15T10:00:00Z' },
    { id: 'gallery-002', vendor_id: DEMO_VENDOR_ID, image_url: 'https://images.unsplash.com/photo-1541480551145-2370a440d585?w=800&h=600&fit=crop', created_at: '2026-01-16T11:00:00Z' },
    { id: 'gallery-003', vendor_id: DEMO_VENDOR_ID, image_url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&h=600&fit=crop', created_at: '2026-01-17T12:00:00Z' }
];

// Demo Discount Codes - Reduced to 2
export const getDemoDiscounts = () => [
    {
        id: 'discount-001',
        vendor_id: DEMO_VENDOR_ID,
        event_id: null,
        code: 'WELCOME10',
        discount_type: 'percentage',
        discount_value: 10,
        min_purchase_amount: 0,
        max_uses: 100,
        used_count: 23,
        is_active: true,
        expiry_date: '2026-03-31T23:59:59Z',
        created_at: '2026-01-01T00:00:00Z',
        events: null
    },
    {
        id: 'discount-002',
        vendor_id: DEMO_VENDOR_ID,
        event_id: 'demo-event-002',
        code: 'MUSIC20',
        discount_type: 'percentage',
        discount_value: 20,
        min_purchase_amount: 300,
        max_uses: 50,
        used_count: 12,
        is_active: true,
        expiry_date: '2026-02-24T23:59:59Z',
        created_at: '2026-01-15T10:00:00Z',
        events: { title: 'أمسية الموسيقى التقليدية: الصوفية والكلاسيكية' }
    }
];

// Demo Analytics Data
export const getDemoAnalytics = () => ({
    totalRevenue: 8540,
    monthlyRevenue: 2340,
    totalBookings: 47,
    pendingBookings: 2,
    confirmedBookings: 41,
    cancelledBookings: 4,
    totalCustomers: 38,
    activeEvents: 5,
    draftEvents: 1,
    soldTickets: 134,
    revenueGrowth: 27.5,
    bookingsGrowth: 15.3,
    totalEvents: 6,
    recentSales: 18,
    typeDistribution: [
        { name: 'Cultural', value: 28 },
        { name: 'Entertainment', value: 19 }
    ],
    customerLoyalty: [
        { name: 'One-time', value: 22 },
        { name: 'Recurring', value: 12 },
        { name: 'Loyal', value: 4 }
    ],
    genderDistribution: [
        { name: 'Male', value: 20 },
        { name: 'Female', value: 15 },
        { name: 'Unknown', value: 3 }
    ],
    ageDistribution: [
        { name: '18-25', value: 8 },
        { name: '26-35', value: 18 },
        { name: '36-45', value: 9 },
        { name: '46+', value: 3 }
    ],
    monthlyData: [
        { month: 'Aug', revenue: 1200, bookings: 8 },
        { month: 'Sep', revenue: 1850, bookings: 12 },
        { month: 'Oct', revenue: 1450, bookings: 10 },
        { month: 'Nov', revenue: 2100, bookings: 15 },
        { month: 'Dec', revenue: 1640, bookings: 11 },
        { month: 'Jan', revenue: 2340, bookings: 18 }
    ]
});

// Demo Reviews
export const getDemoReviews = () => [
    {
        id: 'review-001',
        event_id: 'demo-event-001',
        user_id: 'user-001',
        rating: 5,
        comment: 'Amazing experience! Learned so much about Turkish coffee culture.',
        created_at: '2026-01-29T16:00:00Z',
        user: { full_name: 'Ahmed Hassan' }
    },
    {
        id: 'review-002',
        event_id: 'demo-event-004',
        user_id: 'user-003',
        rating: 5,
        comment: 'Beautiful music and wonderful atmosphere. Highly recommended!',
        created_at: '2026-01-26T20:00:00Z',
        user: { full_name: 'Omar Demir' }
    },
    {
        id: 'review-003',
        event_id: 'demo-event-005',
        user_id: 'user-004',
        rating: 4,
        comment: 'Great tour guide with lots of historical insights.',
        created_at: '2026-02-11T14:30:00Z',
        user: { full_name: 'Yasmin Kaya' }
    }
];
