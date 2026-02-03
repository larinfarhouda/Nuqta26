-- Clean up old subscription fields from profiles table
-- These have been migrated to the vendors table
-- Run this AFTER verifying all subscription features work correctly

-- Drop subscription columns from profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_tier;
ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_status;
ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_starts_at;
ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_expires_at;
ALTER TABLE profiles DROP COLUMN IF EXISTS is_founder_pricing;
ALTER TABLE profiles DROP COLUMN IF EXISTS platform_signup_date;

-- Drop related indexes
DROP INDEX IF EXISTS idx_profiles_subscription_tier;
DROP INDEX IF EXISTS idx_profiles_subscription_status;
DROP INDEX IF EXISTS idx_profiles_founder_pricing;

-- Add comment
COMMENT ON TABLE profiles IS 'User profiles. Subscription data is now in vendors table for vendor accounts.';
