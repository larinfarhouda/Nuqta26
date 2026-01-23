-- Add bank details to vendors
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
ADD COLUMN IF NOT EXISTS bank_iban TEXT;

-- Add payment info to bookings
-- First, define allowed statuses if not already clear, but we'll use string for now to match project style
-- Statuses: 'confirmed', 'pending_payment', 'payment_submitted', 'cancelled'

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'bank_transfer',
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS payment_note TEXT;

-- Update RLS if needed, but since we add columns to already governed tables, 
-- existing policies usually suffice unless we want specific restricted access.
-- Vendors can already update their own row.
-- Users can already see their own bookings.
