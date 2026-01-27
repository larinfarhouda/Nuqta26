-- Diagnostic: Check the Book Club event and its vendor relationship
-- Run this in your Supabase SQL Editor

-- 1. First, find the event and check its vendor_id
SELECT 
    id as event_id,
    title,
    slug,
    vendor_id,
    status,
    created_at
FROM events
WHERE title LIKE '%نادي الكتاب%' OR title LIKE '%Book Club%'
ORDER BY created_at DESC;

-- 2. If you found the event above, check if the vendor exists
-- Replace 'YOUR_VENDOR_ID_FROM_ABOVE' with the actual vendor_id from query 1
SELECT 
    id,
    business_name,
    bank_name,
    bank_account_name,
    bank_iban,
    created_at
FROM vendors
WHERE id = 'YOUR_VENDOR_ID_FROM_ABOVE';

-- 3. List all vendors to see who exists
SELECT 
    id,
    business_name,
    bank_name,
    bank_iban,
    created_at
FROM vendors
ORDER BY created_at DESC;

-- 4. List all events with their vendor status
SELECT 
    e.id,
    e.title,
    e.vendor_id,
    e.status,
    v.business_name,
    CASE 
        WHEN e.vendor_id IS NULL THEN 'NO VENDOR ASSIGNED'
        WHEN v.id IS NULL THEN 'VENDOR DOES NOT EXIST'
        WHEN v.bank_iban IS NULL THEN 'VENDOR MISSING BANK INFO'
        ELSE 'OK'
    END as vendor_status
FROM events e
LEFT JOIN vendors v ON e.vendor_id = v.id
WHERE e.status = 'published'
ORDER BY e.created_at DESC;
