-- Migration: Move subscription fields from profiles to vendors table
-- This improves data architecture by placing vendor-specific data in the vendors table

-- Step 1: Add subscription columns to vendors table
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'starter' 
CHECK (subscription_tier IN ('starter', 'growth', 'professional'));

ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active'
CHECK (subscription_status IN ('active', 'trial', 'expired', 'cancelled'));

ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS subscription_starts_at TIMESTAMP;

ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;

ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS is_founder_pricing BOOLEAN DEFAULT FALSE;

-- Step 2: Migrate existing subscription data from profiles to vendors
-- Only migrate for users who have vendor entries
UPDATE vendors v
SET 
  subscription_tier = COALESCE(p.subscription_tier, 'starter'),
  subscription_status = COALESCE(p.subscription_status, 'active'),
  subscription_starts_at = p.subscription_starts_at,
  subscription_expires_at = p.subscription_expires_at,
  is_founder_pricing = COALESCE(p.is_founder_pricing, FALSE)
FROM profiles p
WHERE v.id = p.id;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendors_subscription_tier ON vendors(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_vendors_subscription_status ON vendors(subscription_status);
CREATE INDEX IF NOT EXISTS idx_vendors_founder_pricing ON vendors(is_founder_pricing);

-- Step 4: Add helpful comments
COMMENT ON COLUMN vendors.subscription_tier IS 'Current subscription tier: starter (free), growth (3 events), professional (unlimited)';
COMMENT ON COLUMN vendors.subscription_status IS 'Status of the subscription: active, trial, expired, or cancelled';
COMMENT ON COLUMN vendors.is_founder_pricing IS 'True if vendor locked in founder pricing (50% off forever) during launch period';

-- Note: We are NOT dropping the columns from profiles yet
-- This will be done in a follow-up migration after verification
