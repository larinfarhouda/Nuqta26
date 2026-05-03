-- =============================================================================
-- Subscription Model Overhaul Migration
-- =============================================================================
-- Renames tiers: starter→free, growth→pro, professional→business
-- Replaces founder pricing with monthly/annual billing
-- Updates country pricing to new model
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. RENAME PRICE COLUMNS ON COUNTRIES TABLE
-- -----------------------------------------------------------------------------
-- Old: subscription_growth_price, subscription_professional_price,
--      subscription_growth_founder_price, subscription_professional_founder_price
-- New: subscription_pro_monthly_price, subscription_business_monthly_price,
--      subscription_pro_annual_price, subscription_business_annual_price

ALTER TABLE countries RENAME COLUMN subscription_growth_price TO subscription_pro_monthly_price;
ALTER TABLE countries RENAME COLUMN subscription_professional_price TO subscription_business_monthly_price;
ALTER TABLE countries RENAME COLUMN subscription_growth_founder_price TO subscription_pro_annual_price;
ALTER TABLE countries RENAME COLUMN subscription_professional_founder_price TO subscription_business_annual_price;

-- -----------------------------------------------------------------------------
-- 2. UPDATE PRICES (Turkey & Egypt)
-- -----------------------------------------------------------------------------

UPDATE countries SET
  subscription_pro_monthly_price = 299,
  subscription_pro_annual_price = 2990,
  subscription_business_monthly_price = 499,
  subscription_business_annual_price = 4990
WHERE id = 'tr';

UPDATE countries SET
  subscription_pro_monthly_price = 449,
  subscription_pro_annual_price = 4490,
  subscription_business_monthly_price = 749,
  subscription_business_annual_price = 7490
WHERE id = 'eg';

-- -----------------------------------------------------------------------------
-- 3. ADD BILLING PERIOD COLUMN TO VENDORS
-- -----------------------------------------------------------------------------

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'billing_period'
  ) THEN
    ALTER TABLE vendors ADD COLUMN billing_period TEXT DEFAULT 'monthly';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4. MIGRATE TIER NAMES
-- -----------------------------------------------------------------------------

UPDATE vendors SET subscription_tier = 'free' WHERE subscription_tier = 'starter' OR subscription_tier IS NULL;
UPDATE vendors SET subscription_tier = 'pro' WHERE subscription_tier = 'growth';
UPDATE vendors SET subscription_tier = 'business' WHERE subscription_tier = 'professional';

-- -----------------------------------------------------------------------------
-- 5. COMMENTS
-- -----------------------------------------------------------------------------
COMMENT ON COLUMN countries.subscription_pro_monthly_price IS 'Monthly price for Pro tier in local currency';
COMMENT ON COLUMN countries.subscription_pro_annual_price IS 'Annual price for Pro tier in local currency (2 months free)';
COMMENT ON COLUMN countries.subscription_business_monthly_price IS 'Monthly price for Business tier in local currency';
COMMENT ON COLUMN countries.subscription_business_annual_price IS 'Annual price for Business tier in local currency (2 months free)';
COMMENT ON COLUMN vendors.billing_period IS 'monthly or annual — determines which price the vendor pays';
