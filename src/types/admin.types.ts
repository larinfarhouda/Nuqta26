/**
 * Admin Types
 * TypeScript interfaces for the Super Admin panel
 */

// ─── Dashboard Stats ────────────────────────────────────────────────────────

export interface PlatformStats {
    totalUsers: number;
    totalVendors: number;
    totalBookings: number;
    totalEvents: number;
    totalBookingValue: number;     // Aggregate value of all bookings (platform throughput)
    pendingPayments: number;       // Bookings awaiting payment confirmation
    userGrowth: number;            // % growth vs previous 30 days
    vendorGrowth: number;          // % growth vs previous 30 days
    bookingGrowth: number;         // % growth vs previous 30 days
}

export interface SubscriptionRevenue {
    starterCount: number;
    growthCount: number;
    professionalCount: number;
    totalVendors: number;
}

export interface TrendDataPoint {
    date: string;
    bookings: number;
    revenue: number;
}

export interface CategoryStat {
    name: string;
    value: number;
}

export interface EventStatusCounts {
    published: number;
    draft: number;
    cancelled: number;
    featured: number;
}

// ─── Vendor Management ──────────────────────────────────────────────────────

export interface AdminVendor {
    id: string;
    business_name: string;
    company_logo: string | null;
    slug: string | null;
    category: string;
    status: string | null;
    is_verified: boolean | null;
    subscription_tier: string | null;
    billing_period: string;
    created_at: string | null;
    email: string | null;
    full_name: string | null;
    eventCount: number;
    bookingCount: number;
    country: string | null;
}

export interface AdminVendorDetail {
    id: string;
    business_name: string;
    company_logo: string | null;
    cover_image: string | null;
    slug: string | null;
    category: string;
    description_ar: string | null;
    status: string | null;
    is_verified: boolean | null;
    whatsapp_number: string | null;
    website: string | null;
    instagram: string | null;
    country: string | null;
    location_name: string | null;
    location_details: string | null;
    location_lat: number | null;
    location_long: number | null;
    bank_name: string | null;
    bank_account_name: string | null;
    bank_iban: string | null;
    subscription_tier: string | null;
    subscription_status: string | null;
    subscription_starts_at: string | null;
    subscription_expires_at: string | null;
    billing_period: string;
    cancellation_policy: string | null;
    return_policy: string | null;
    tax_id_document: string | null;
    created_at: string | null;
    // Joined from profiles
    email: string | null;
    full_name: string | null;
    // Counts
    eventCount: number;
    bookingCount: number;
}

export interface VendorDirectoryParams {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    tier?: string;
}

// ─── Booking Management ─────────────────────────────────────────────────────

export interface BankTransferBooking {
    id: string;
    user_id: string | null;
    event_id: string | null;
    vendor_id: string | null;
    status: string | null;
    total_amount: number | null;
    discount_amount: number | null;
    payment_method: string | null;
    payment_proof_url: string | null;
    payment_note: string | null;
    contact_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    created_at: string | null;
    profiles: { full_name: string | null; email: string | null } | null;
    events: { title: string | null; date: string | null } | null;
    vendors: { business_name: string | null } | null;
}

// ─── Moderation ─────────────────────────────────────────────────────────────

export interface FlaggedReview {
    id: string;
    event_id: string | null;
    user_id: string | null;
    rating: number;
    comment: string | null;
    is_flagged: boolean | null;
    created_at: string | null;
    flag_count: number;
    event_title: string | null;
    reviewer_name: string | null;
    reviewer_email: string | null;
}

// ─── Prospect Vendors (Phantom Listings) ────────────────────────────────────

export type ProspectStatus = 'lead' | 'building' | 'pitched' | 'free' | 'paying' | 'churned' | 'lost';

export interface ProspectVendor {
    id: string;
    business_name: string;
    logo_url: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    instagram: string | null;
    website: string | null;
    notes: string | null;
    bio: string | null;
    location: string | null;
    status: ProspectStatus | null;
    lost_reason: string | null;
    last_contacted_at: string | null;
    claim_token: string | null;
    converted_vendor_id: string | null;
    created_at: string | null;
    updated_at: string | null;
    eventCount: number;
    totalInterests: number;
}

export interface CreateProspectVendorInput {
    business_name: string;
    logo_url?: string;
    contact_email?: string;
    contact_phone?: string;
    instagram?: string;
    website?: string;
    notes?: string;
    bio?: string;
    location?: string;
}

export interface CreateProspectEventInput {
    prospect_vendor_id: string;
    title: string;
    description?: string;
    image_url?: string;
    date: string;
    end_date?: string;
    location_name?: string;
    location_lat?: number;
    location_long?: number;
    district?: string;
    city?: string;
    country?: string;
    capacity?: number;
    event_type?: string;
}

export interface EventInterestSummary {
    eventId: string;
    eventTitle: string;
    interestCount: number;
    interestedUsers: {
        userId: string;
        fullName: string | null;
        email: string | null;
        interestedAt: string | null;
    }[];
}

// ─── Activity Logs ──────────────────────────────────────────────────────────

export type ActivityAction =
    | 'user_signup'
    | 'vendor_signup'
    | 'event_published'
    | 'event_created'
    | 'booking_created'
    | 'booking_confirmed'
    | 'booking_cancelled'
    | 'payment_submitted'
    | 'payment_confirmed'
    | 'payment_rejected'
    | 'review_created'
    | 'review_flagged'
    | 'vendor_approved'
    | 'vendor_suspended'
    | 'prospect_created'
    | 'prospect_contacted'
    | 'prospect_pitched'
    | 'prospect_converted'
    | 'prospect_updated'
    | 'prospect_deleted'
    | 'prospect_status_changed'
    | 'event_featured'
    | 'interest_expressed'
    | 'subscription_changed'
    | 'vendor_updated'
    | 'vendor_impersonated';

export interface ActivityLog {
    id: string;
    user_id: string | null;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    metadata: Record<string, any>;
    ip_address: string | null;
    created_at: string | null;
    user_name?: string | null;
    user_email?: string | null;
}

export interface CreateActivityLogInput {
    user_id?: string;
    action: ActivityAction;
    entity_type?: string;
    entity_id?: string;
    metadata?: Record<string, any>;
    ip_address?: string;
}

// ─── Pagination ─────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
