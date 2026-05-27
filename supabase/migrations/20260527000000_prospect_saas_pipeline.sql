-- =============================================================================
-- Migration: Prospect Vendors — SaaS Pipeline Enhancement
-- Adds bio, location, tracking fields and updates statuses for SaaS model
-- =============================================================================

-- 1. Add new columns
ALTER TABLE prospect_vendors ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE prospect_vendors ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE prospect_vendors ADD COLUMN IF NOT EXISTS lost_reason TEXT;
ALTER TABLE prospect_vendors ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;

-- 2. Update status constraint for new SaaS pipeline stages
ALTER TABLE prospect_vendors DROP CONSTRAINT IF EXISTS prospect_vendors_status_check;
ALTER TABLE prospect_vendors ADD CONSTRAINT prospect_vendors_status_check
  CHECK (status IN ('lead', 'building', 'pitched', 'free', 'paying', 'churned', 'lost'));

-- 3. Migrate existing data to new statuses
UPDATE prospect_vendors SET status = 'lead' WHERE status = 'prospect';
UPDATE prospect_vendors SET status = 'pitched' WHERE status = 'contacted';
UPDATE prospect_vendors SET status = 'paying' WHERE status = 'converted';
UPDATE prospect_vendors SET status = 'lost' WHERE status = 'rejected';

-- 4. Comments
COMMENT ON COLUMN prospect_vendors.bio IS 'Vendor bio/description from Instagram or manual entry';
COMMENT ON COLUMN prospect_vendors.location IS 'Vendor location (city/area)';
COMMENT ON COLUMN prospect_vendors.lost_reason IS 'Why the lead was lost (admin notes)';
COMMENT ON COLUMN prospect_vendors.last_contacted_at IS 'When the vendor was last contacted/pitched';
