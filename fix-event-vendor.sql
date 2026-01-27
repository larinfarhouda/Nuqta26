-- Fix Event Vendor Assignment
-- Replace the variables below with actual values

-- Step 1: Find your vendor ID
-- Run this first to list all vendors:
SELECT id, business_name FROM vendors;

-- Step 2: Update the event with the correct vendor
-- Replace 'CORRECT_VENDOR_ID_HERE' with the actual vendor UUID
-- Replace 'EVENT_SLUG_HERE' with your event slug (e.g., 'نادي-الكتاب-...')

UPDATE events 
SET vendor_id = 'CORRECT_VENDOR_ID_HERE'
WHERE slug LIKE '%نادي%الكتاب%' 
   OR title LIKE '%نادي الكتاب%';

-- Step 3: Verify the fix
SELECT 
    e.title,
    e.vendor_id,
    v.business_name,
    v.bank_iban
FROM events e
LEFT JOIN vendors v ON e.vendor_id = v.id
WHERE e.slug LIKE '%نادي%الكتاب%';
