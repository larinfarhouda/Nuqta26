# Pilot release checklist

## Country behavior

- Active countries, currencies, phone prefixes and subscription prices come from `countries`.
- An explicit country cookie takes precedence over Vercel IP geolocation. Without either a supported location or an explicit choice, visitors browse globally and choose a supported event country before organizer signup or viewing prices.
- Event and organizer currencies remain attached to their records; visiting from another country does not convert ticket prices.
- To launch another market, configure and activate its country, currency, prices, cities and payment methods in admin. Visitor geolocation alone does not make a market operational.

## Receipt release (required)

Deploy the application and `supabase/migrations/20260914000000_private_booking_receipts.sql` in a coordinated release. The migration makes the bucket private, limits uploads and adds restrictive ownership policies. Until it is applied, the production bucket is not secured by this code change alone. New application code reads existing first-party receipt URLs through the authenticated route and writes new object paths.

Before opening uploads, verify in a staging database that:

1. An attendee can upload a supported file to their pending booking and view it.
2. Another attendee cannot upload or read that receipt, including using a direct storage request.
3. Only the booking attendee, organizer and an authorized admin can read it.
4. Confirmed/cancelled bookings reject new receipt submissions.
5. Old public URLs no longer provide anonymous access. Existing signed URLs may remain usable until their expiry; previously downloaded copies cannot be recalled.
6. An existing legacy receipt still opens for its owner after the migration.

## Pilot operation

Review the terms and privacy pages against the actual operator, local requirements, provider configuration and support practices before public operation. These pages describe the product flow and do not establish company registration or legal compliance.

Use test accounts and a test event to check paid and free booking, payment verification, cancellation/refund handling, last-seat concurrency and transactional emails. No real bookings or user accounts were created by the read-only browser smoke checks.

For the first five hosts, record first event published, completed bookings, repeat event publication, support time and paid-plan interest weekly. Existing activity logs and booking records support the initial manual review.
