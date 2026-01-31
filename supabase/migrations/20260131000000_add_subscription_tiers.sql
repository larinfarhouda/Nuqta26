-- Add subscription management columns to profiles table
-- Migration: Add subscription tiers and founder pricing support

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'starter' 
CHECK (subscription_tier IN ('starter', 'growth', 'professional'));

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active'
CHECK (subscription_status IN ('active', 'trial', 'expired', 'cancelled'));

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_starts_at TIMESTAMP;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;

-- CRITICAL: Founder pricing flag - locks in 50% discount forever
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_founder_pricing BOOLEAN DEFAULT FALSE;

-- Track when vendor signed up (determines founder pricing eligibility)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS platform_signup_date TIMESTAMP DEFAULT NOW();

-- Set platform_signup_date for existing vendors
UPDATE profiles 
SET platform_signup_date = created_at 
WHERE platform_signup_date IS NULL;

-- Add index for faster subscription queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_founder_pricing ON profiles(is_founder_pricing);

-- Add comment for documentation
COMMENT ON COLUMN profiles.is_founder_pricing IS 'True if vendor locked in founder pricing (50% off forever) during launch period';
COMMENT ON COLUMN profiles.platform_signup_date IS 'Date vendor first signed up - determines eligibility for founder pricing';
COMMENT ON COLUMN profiles.subscription_tier IS 'Current subscription tier: starter (free), growth (3 events), professional (unlimited)';
