-- =============================================================================
-- Fix: Sync phone, age, gender, country, city from auth.users metadata to profiles
-- =============================================================================
-- The registration form stores phone, age, gender, country, city in
-- auth.users.raw_user_meta_data but the triggers never copied them to profiles.

-- 1. Fix the INSERT trigger (new user creation)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_role text;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', 'user');

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
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'city',
    (new.raw_user_meta_data->'referral_source')::jsonb
  );

  if user_role = 'vendor' then
    insert into public.vendors (id, business_name, category, subscription_tier)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', 'Business Name'),
      'other',
      'starter'
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- 2. Fix the UPDATE trigger (user metadata sync)
create or replace function public.handle_user_update()
returns trigger as $$
begin
  update public.profiles
  set email = new.email,
      full_name = coalesce(new.raw_user_meta_data->>'full_name', full_name),
      avatar_url = coalesce(new.raw_user_meta_data->>'avatar_url', avatar_url),
      role = coalesce(new.raw_user_meta_data->>'role', role),
      phone = coalesce(new.raw_user_meta_data->>'phone', phone),
      age = coalesce((nullif(new.raw_user_meta_data->>'age', ''))::int, age),
      gender = coalesce(new.raw_user_meta_data->>'gender', gender),
      country = coalesce(new.raw_user_meta_data->>'country', country),
      city = coalesce(new.raw_user_meta_data->>'city', city)
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

-- 3. Backfill existing profiles from auth.users metadata
update public.profiles p
set
  phone   = coalesce(p.phone, u.raw_user_meta_data->>'phone'),
  age     = coalesce(p.age, (nullif(u.raw_user_meta_data->>'age', ''))::int),
  gender  = coalesce(p.gender, u.raw_user_meta_data->>'gender'),
  country = coalesce(p.country, u.raw_user_meta_data->>'country'),
  city    = coalesce(p.city, u.raw_user_meta_data->>'city')
from auth.users u
where p.id = u.id
  and (
    (p.phone is null and u.raw_user_meta_data->>'phone' is not null)
    or (p.age is null and u.raw_user_meta_data->>'age' is not null)
    or (p.gender is null and u.raw_user_meta_data->>'gender' is not null)
    or (p.country is null and u.raw_user_meta_data->>'country' is not null)
    or (p.city is null and u.raw_user_meta_data->>'city' is not null)
  );
