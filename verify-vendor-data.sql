-- Script to verify vendor-event relationships and check for mismatches

-- 1. Check the "Book Club" event and its vendor
SELECT 
    e.id,
    e.title,
    e.vendor_id,
   v.business_name as vendor_name,
    v.bank_name,
    v.bank_iban
FROM events e
LEFT JOIN vendors v ON e.vendor_id = v.id
WHERE e.title LIKE '%نادي الكتاب%' OR e.title LIKE '%Book Club%';

-- 2. Check all events and their vendor associations
SELECT 
    e.id,
    e.title,
    e.vendor_id,
    v.business_name,
    CASE 
        WHEN v.bank_iban IS NULL THEN 'MISSING BANK INFO'
        ELSE 'HAS BANK INFO'
    END as bank_status
FROM events e
LEFT JOIN vendors v ON e.vendor_id = v.id
WHERE e.status = 'published'
ORDER BY e.created_at DESC;

-- 3. Find vendors with missing bank information
SELECT 
    id,
    business_name,
    bank_name,
    bank_account_name,
    bank_iban
FROM vendors
ORDER BY created_at DESC;
