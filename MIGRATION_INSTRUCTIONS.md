# Manual Database Migration Instructions

## Move Subscription Fields to Vendors Table

Since local Supabase/Docker isn't running, you need to apply this migration to your remote database manually.

---

## Option 1: Via Supabase Dashboard (Recommended - EASIEST)

1. Go to: **https://supabase.com/dashboard/project/jhojxyyfkirkmfunaahy**
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the SQL below
5. Click **Run** or press `Cmd/Ctrl + Enter`

---

## SQL Migration Script

```sql
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
```

---

## Verification After Running

Check that the migration worked correctly:

```sql
-- Verify new columns exist in vendors table
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'vendors' 
AND column_name IN (
    'subscription_tier', 
    'subscription_status', 
    'is_founder_pricing',
    'subscription_starts_at',
    'subscription_expires_at'
);

-- Verify data was migrated
SELECT id, business_name, subscription_tier, is_founder_pricing
FROM vendors
LIMIT 5;
```

Expected: You should see 5 new columns in vendors table and existing vendors should have their subscription data.

---

## What This Does

✅ **Adds 5 columns to vendors table**:
   - `subscription_tier` - starter/growth/professional
   - `subscription_status` - active/trial/expired/cancelled  
   - `subscription_starts_at` - When subscription began
   - `subscription_expires_at` - When it expires
   - `is_founder_pricing` - Lifetime 50% discount flag

✅ **Migrates all existing data** from profiles → vendors  
✅ **Creates performance indexes** for fast queries  
✅ **Preserves old data** in profiles (for safety, will remove later)

---

## After Migration

Once applied successfully:

1. **TypeScript errors will disappear** (database schema matches code now)
2. **Refresh your browser** to test vendor dashboard
3. **Test these features**:
   - Vendor dashboard subscription badge
   - Event creation tier limits
   - Subscription upgrade prompts

---

## Cleanup (Run Later After Verification)

After you've tested and verified everything works, you can optionally clean up the old columns from profiles:

```sql
-- ONLY RUN THIS AFTER VERIFYING EVERYTHING WORKS!
ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_tier;
ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_status;
ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_starts_at;
ALTER TABLE profiles DROP COLUMN IF EXISTS subscription_expires_at;
ALTER TABLE profiles DROP COLUMN IF EXISTS is_founder_pricing;
ALTER TABLE profiles DROP COLUMN IF EXISTS platform_signup_date;

DROP INDEX IF EXISTS idx_profiles_subscription_tier;
DROP INDEX IF EXISTS idx_profiles_subscription_status;
DROP INDEX IF EXISTS idx_profiles_founder_pricing;
```

**Don't run the cleanup yet! Test first!**

