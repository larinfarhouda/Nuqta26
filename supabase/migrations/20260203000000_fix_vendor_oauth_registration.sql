-- Fix Vendor OAuth Registration
-- Issue: handle_new_user() only creates profiles entries, not vendors entries
-- This causes vendors to have no vendors table record, breaking subscription features

-- Step 1: Update handle_new_user() trigger to create vendors entries automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role text;
BEGIN
  -- Get role from metadata (set during registration)
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'user');
  
  -- Create profile with role
  INSERT INTO public.profiles (id, full_name, avatar_url, email, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    user_role
  );
  
  -- If vendor, also create vendors entry with default subscription and category
  IF user_role = 'vendor' THEN
    INSERT INTO public.vendors (id, business_name, category, subscription_tier)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', 'Business Name'),
      'other',  -- Default category - vendor can update later
      'starter'  -- Default tier for new vendors
    );
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Backfill missing vendor entries for existing users
-- This fixes vendors who registered before this migration
INSERT INTO public.vendors (id, business_name, category, subscription_tier)
SELECT 
  p.id,
  COALESCE(p.full_name, 'Business Name') as business_name,
  'other' as category,  -- Default category for existing vendors
  'starter' as subscription_tier
FROM public.profiles p
LEFT JOIN public.vendors v ON p.id = v.id
WHERE p.role = 'vendor' 
AND v.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Add helpful comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates profile and vendor entries for new users. Vendors get default starter tier.';
