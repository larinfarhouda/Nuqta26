-- Add referral_source column to profiles table
-- Stores UTM parameters and referrer data for tracking user acquisition
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_source jsonb;

COMMENT ON COLUMN profiles.referral_source IS
  'JSON object storing UTM params and referrer data from user registration. Example: {"utm_source":"instagram","utm_medium":"social","utm_campaign":"spring2026","referrer":"","landing_page":"/en"}';

-- Update the handle_new_user trigger to also save referral_source
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role text;
BEGIN
  user_role := coalesce(new.raw_user_meta_data->>'role', 'user');

  INSERT INTO public.profiles (id, full_name, avatar_url, email, role, referral_source)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    user_role,
    (new.raw_user_meta_data->'referral_source')::jsonb
  );

  IF user_role = 'vendor' THEN
    INSERT INTO public.vendors (id, business_name, category, subscription_tier)
    VALUES (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', 'Business Name'),
      'other',
      'starter'
    );
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
