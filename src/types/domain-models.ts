/**
 * Domain Models
 * 
 * Decouples business logic from Supabase database types.
 * These models represent the core business entities with computed properties
 * and domain-specific methods, independent of the storage layer.
 */

import { Tables } from '@/types/database.types';

// ========================================
// Event Domain Model
// ========================================

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type EventType = 'workshop' | 'concert' | 'seminar' | 'exhibition' | 'conference' | 'meetup' | 'other';

export interface EventModel {
    id: string;
    title: string;
    slug: string | null;
    description: string | null;
    eventType: EventType | null;
    status: EventStatus;

    // Dates
    date: Date;
    endDate: Date | null;
    createdAt: Date | null;

    // Location
    locationName: string | null;
    locationLat: number | null;
    locationLong: number | null;
    city: string | null;
    district: string | null;
    country: string | null;
    locationDetails: string | null;

    // Capacity & Media
    capacity: number | null;
    imageUrl: string | null;

    // Relationships
    vendorId: string;
    categoryId: string | null;

    // Feature flags
    isFeatured: boolean;
    featuredAt: Date | null;
    isRecurring: boolean;
    recurrenceType: string | null;
    recurrenceEndDate: Date | null;
    recurrenceDays: string[] | null;

    // Computed
    isPast: boolean;
    isUpcoming: boolean;
    isLive: boolean;
}

/**
 * Map a Supabase events Row to an EventModel
 */
export function toEventModel(row: Tables<'events'>): EventModel {
    const now = new Date();
    const date = new Date(row.date);
    const endDate = row.end_date ? new Date(row.end_date) : null;
    const effectiveEnd = endDate || date;

    return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        eventType: row.event_type as EventType | null,
        status: (row.status || 'draft') as EventStatus,

        date,
        endDate,
        createdAt: row.created_at ? new Date(row.created_at) : null,

        locationName: row.location_name,
        locationLat: row.location_lat,
        locationLong: row.location_long,
        city: row.city,
        district: row.district,
        country: row.country,
        locationDetails: row.location_details,

        capacity: row.capacity,
        imageUrl: row.image_url,

        vendorId: row.vendor_id,
        categoryId: row.category_id,

        isFeatured: row.is_featured || false,
        featuredAt: row.featured_at ? new Date(row.featured_at) : null,
        isRecurring: row.is_recurring || false,
        recurrenceType: row.recurrence_type,
        recurrenceEndDate: row.recurrence_end_date ? new Date(row.recurrence_end_date) : null,
        recurrenceDays: row.recurrence_days,

        // Computed properties
        isPast: effectiveEnd < now,
        isUpcoming: date > now,
        isLive: date <= now && effectiveEnd >= now,
    };
}

// ========================================
// Booking Domain Model
// ========================================

export type BookingStatus = 'pending_payment' | 'payment_submitted' | 'confirmed' | 'cancelled' | 'refunded';

export interface BookingModel {
    id: string;
    eventId: string;
    vendorId: string;
    userId: string | null;
    totalAmount: number | null;
    discountAmount: number | null;
    status: BookingStatus;
    currency: string | null;

    // Contact info
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;

    // Payment
    paymentMethod: string | null;
    paymentProofUrl: string | null;
    paymentNote: string | null;
    discountCodeId: string | null;

    // Lifecycle flags
    reminderSent: boolean;
    reviewRequestSent: boolean;

    createdAt: Date | null;

    // Computed
    isPending: boolean;
    isConfirmed: boolean;
    isCancelled: boolean;
    canBeDeleted: boolean;
}

/**
 * Map a Supabase bookings Row to a BookingModel
 */
export function toBookingModel(row: Tables<'bookings'>): BookingModel {
    const status = (row.status || 'pending_payment') as BookingStatus;

    return {
        id: row.id,
        eventId: row.event_id,
        vendorId: row.vendor_id,
        userId: row.user_id,
        totalAmount: row.total_amount,
        discountAmount: row.discount_amount,
        status,
        currency: row.currency,

        contactName: row.contact_name,
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone,

        paymentMethod: row.payment_method,
        paymentProofUrl: row.payment_proof_url,
        paymentNote: row.payment_note,
        discountCodeId: row.discount_code_id,

        reminderSent: row.reminder_sent || false,
        reviewRequestSent: row.review_request_sent || false,

        createdAt: row.created_at ? new Date(row.created_at) : null,

        // Computed
        isPending: status === 'pending_payment' || status === 'payment_submitted',
        isConfirmed: status === 'confirmed',
        isCancelled: status === 'cancelled' || status === 'refunded',
        canBeDeleted: status === 'pending_payment' || status === 'payment_submitted',
    };
}

// ========================================
// Vendor Domain Model
// ========================================

export type VendorStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type SubscriptionTier = 'starter' | 'growth' | 'professional';

export interface VendorModel {
    id: string;
    businessName: string;
    slug: string | null;
    status: VendorStatus;
    subscriptionTier: SubscriptionTier;
    companyLogo: string | null;

    // Banking
    bankName: string | null;
    bankAccountName: string | null;
    bankIban: string | null;
    hasBankInfo: boolean;

    // Contact
    whatsappNumber: string | null;

    // Policies
    cancellationPolicy: string | null;
    returnPolicy: string | null;

    createdAt: Date | null;
}

/**
 * Map a Supabase vendors Row to a VendorModel
 */
export function toVendorModel(row: Tables<'vendors'>): VendorModel {
    return {
        id: row.id,
        businessName: row.business_name,
        slug: row.slug,
        status: (row.status || 'pending') as VendorStatus,
        subscriptionTier: (row.subscription_tier || 'starter') as SubscriptionTier,
        companyLogo: row.company_logo,

        bankName: row.bank_name,
        bankAccountName: row.bank_account_name,
        bankIban: row.bank_iban,
        hasBankInfo: !!(row.bank_name && row.bank_iban),

        whatsappNumber: row.whatsapp_number,

        cancellationPolicy: row.cancellation_policy,
        returnPolicy: row.return_policy,

        createdAt: row.created_at ? new Date(row.created_at) : null,
    };
}

// ========================================
// Review Domain Model
// ========================================

export interface ReviewModel {
    id: string;
    eventId: string;
    userId: string | null;
    bookingId: string | null;
    rating: number;
    comment: string | null;
    isFlagged: boolean;
    createdAt: Date | null;
    updatedAt: Date | null;
}

/**
 * Map a Supabase event_reviews Row to a ReviewModel
 */
export function toReviewModel(row: Tables<'event_reviews'>): ReviewModel {
    return {
        id: row.id,
        eventId: row.event_id,
        userId: row.user_id,
        bookingId: row.booking_id,
        rating: row.rating,
        comment: row.comment,
        isFlagged: row.is_flagged || false,
        createdAt: row.created_at ? new Date(row.created_at) : null,
        updatedAt: row.updated_at ? new Date(row.updated_at) : null,
    };
}

// ========================================
// Rating Summary Value Object
// ========================================

export interface RatingSummary {
    average: number;
    count: number;
    distribution?: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}
