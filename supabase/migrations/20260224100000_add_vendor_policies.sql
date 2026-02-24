-- Add cancellation and return policy fields to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS cancellation_policy TEXT DEFAULT NULL;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS return_policy TEXT DEFAULT NULL;
