/**
 * Action Input Validation Schemas
 * Zod schemas for all mutation inputs at the server action layer.
 * 
 * These validate data at the API boundary before it reaches services.
 * Invalid data is rejected immediately with structured error messages.
 */

import { z } from 'zod';

// ─── Booking ─────────────────────────────────────────────────────────────────

export const CreateBookingSchema = z.object({
    eventId: z.string().uuid('Invalid event ID'),
    ticketId: z.string().uuid('Invalid ticket ID'),
    quantity: z.number().int().min(1, 'Minimum 1 ticket').max(50, 'Maximum 50 tickets'),
    discountCode: z.string().optional(),
});

export const SubmitPaymentProofSchema = z.object({
    bookingId: z.string().uuid('Invalid booking ID'),
    paymentNote: z.string().max(500, 'Payment note too long').optional(),
});

// ─── Reviews ─────────────────────────────────────────────────────────────────

export const SubmitReviewSchema = z.object({
    eventId: z.string().uuid('Invalid event ID'),
    rating: z.number().int().min(1, 'Minimum rating is 1').max(5, 'Maximum rating is 5'),
    comment: z.string().max(2000, 'Comment too long').optional(),
});

export const FlagReviewSchema = z.object({
    reviewId: z.string().uuid('Invalid review ID'),
    reason: z.string().min(3, 'Reason too short').max(500, 'Reason too long').optional(),
});

// ─── Events ──────────────────────────────────────────────────────────────────

export const CreateEventSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
    description: z.string().max(5000, 'Description too long').optional(),
    event_type: z.string().min(1, 'Event type is required'),
    date: z.string().min(1, 'Date is required'),
    end_date: z.string().optional(),
    location_name: z.string().min(1, 'Location is required'),
    location_lat: z.number().optional(),
    location_long: z.number().optional(),
    district: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    capacity: z.number().int().min(0).optional(),
});

// ─── Vendor ──────────────────────────────────────────────────────────────────

export const UpdateVendorProfileSchema = z.object({
    business_name: z.string().min(2, 'Business name too short').max(200, 'Business name too long').optional(),
    description_ar: z.string().max(2000).optional(),
    whatsapp_number: z.string().max(20).optional(),
    website: z.string().url('Invalid URL').or(z.literal('')).optional(),
    instagram: z.string().max(100).optional(),
    bank_name: z.string().max(100).optional(),
    bank_account_name: z.string().max(200).optional(),
    bank_iban: z.string().max(34).optional(),
    cancellation_policy: z.string().max(2000).optional(),
    return_policy: z.string().max(2000).optional(),
});

// ─── Admin ───────────────────────────────────────────────────────────────────

export const UpdateVendorStatusSchema = z.object({
    vendorId: z.string().uuid('Invalid vendor ID'),
    status: z.enum(['approved', 'suspended', 'pending']),
});

export const ConfirmPaymentSchema = z.object({
    bookingId: z.string().uuid('Invalid booking ID'),
});

export const CreateProspectSchema = z.object({
    business_name: z.string().min(2, 'Business name too short').max(200),
    contact_email: z.string().email('Invalid email').optional(),
    contact_phone: z.string().max(20).optional(),
    instagram: z.string().max(100).optional(),
    website: z.string().url('Invalid URL').or(z.literal('')).optional(),
    notes: z.string().max(1000).optional(),
});

// ─── Auth ────────────────────────────────────────────────────────────────────

export const SignUpSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export const SignInSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

// ─── Contact / Interest ──────────────────────────────────────────────────────

export const ExpressInterestSchema = z.object({
    eventId: z.string().uuid('Invalid event ID'),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Validate input and return structured result compatible with the Result pattern.
 * 
 * @example
 * ```typescript
 * const validation = validateInput(CreateBookingSchema, { eventId, ticketId, quantity });
 * if (!validation.success) {
 *   return { error: validation.error };
 * }
 * const { data } = validation;
 * ```
 */
export function validateInput<T>(
    schema: z.ZodSchema<T>,
    input: unknown
): { success: true; data: T } | { success: false; error: string } {
    const result = schema.safeParse(input);

    if (!result.success) {
        const firstIssue = result.error.issues[0];
        const message = firstIssue
            ? `${firstIssue.path.join('.')}: ${firstIssue.message}`
            : 'Invalid input';
        return { success: false, error: message };
    }

    return { success: true, data: result.data };
}
