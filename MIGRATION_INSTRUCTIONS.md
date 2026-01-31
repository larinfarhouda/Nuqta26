# Manual Database Migration Instructions

## Subscription Tiers Migration

Since local Supabase/Docker isn't running, you need to apply this migration to your remote database.

---

## Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire SQL below
5. Click **Run** or press `Cmd/Ctrl + Enter`

---

## SQL Migration Script

```sql
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

-- Add comments for documentation
COMMENT ON COLUMN profiles.is_founder_pricing IS 'True if vendor locked in founder pricing (50% off forever) during launch period';
COMMENT ON COLUMN profiles.platform_signup_date IS 'Date vendor first signed up - determines eligibility for founder pricing';
COMMENT ON COLUMN profiles.subscription_tier IS 'Current subscription tier: starter (free), growth (3 events), professional (unlimited)';
```

---

## Option 2: Via Command Line (If you have psql access)

```bash
# Connect to your remote database
psql "your-supabase-connection-string"

# Then paste the SQL above
```

---

## Option 3: Using Supabase CLI with Remote Project

```bash
# Link to your remote project (if not already)
npx supabase link --project-ref your-project-ref

# Apply pending migrations
npx supabase db push
```

---

## Verification

After running the migration, verify it worked:

```sql
-- Check new columns exist
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN (
    'subscription_tier', 
    'subscription_status', 
    'is_founder_pricing',
    'platform_signup_date',
    'subscription_starts_at',
    'subscription_expires_at'
);
```

Expected output: 6 rows showing all the new columns.

---

## What This Does

✅ Adds `subscription_tier` - Tracks starter/growth/professional tier
✅ Adds `subscription_status` - Tracks active/trial/expired/cancelled
✅ Adds `is_founder_pricing` - **Critical flag** for lifetime 50% discount
✅ Adds `platform_signup_date` - Determines founder pricing eligibility
✅ Adds `subscription_starts_at` - When subscription began
✅ Adds `subscription_expires_at` - When subscription/trial ends
✅ Creates indexes for fast queries
✅ Sets all existing vendors to 'starter' tier by default
✅ Sets platform_signup_date to their created_at date

---

## After Migration

Once applied:
- TypeScript errors will disappear
- Event limit enforcement will work automatically
- All existing vendors will be on 'starter' tier (1 event limit)

You can then manually upgrade specific vendors in the Supabase dashboard if needed.
