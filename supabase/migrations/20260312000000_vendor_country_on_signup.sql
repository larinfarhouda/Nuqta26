-- =============================================================================
-- Fix: Include country when creating vendor record from auth signup
-- =============================================================================
-- The handle_new_user() trigger creates a vendor row on signup but doesn't
-- include the country from metadata. This means vendor.country is NULL for
-- new signups. Adding country extraction from raw_user_meta_data.

create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_role text;
  user_country text;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', 'user');
  user_country := coalesce(new.raw_user_meta_data->>'country', 'tr');

  insert into public.profiles (id, full_name, avatar_url, email, role, phone, age, gender, country, city, referral_source)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    user_role,
    new.raw_user_meta_data->>'phone',
    (nullif(new.raw_user_meta_data->>'age', ''))::int,
    new.raw_user_meta_data->>'gender',
    user_country,
    new.raw_user_meta_data->>'city',
    (new.raw_user_meta_data->'referral_source')::jsonb
  );

  if user_role = 'vendor' then
    insert into public.vendors (id, business_name, category, subscription_tier, country)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', 'Business Name'),
      'other',
      'starter',
      user_country
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;
