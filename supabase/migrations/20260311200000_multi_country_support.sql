-- =============================================================================
-- Multi-Country Support Migration
-- =============================================================================
-- Adds database-driven country configuration with:
-- - countries, cities, banks, payment_methods tables
-- - vendor_payment_methods junction table
-- - Backfills existing data with country = 'tr'
-- - Migrates existing vendor bank info into new payment methods system
-- - Seeds Turkey + Egypt data
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. NEW TABLES
-- -----------------------------------------------------------------------------

-- 1.1 COUNTRIES — Master country configuration
create table if not exists countries (
  id text primary key,                        -- 'tr', 'eg', etc.
  name_en text not null,
  name_ar text not null,
  currency_code text not null,                -- 'TRY', 'EGP'
  currency_symbol text not null,              -- '₺', 'ج.م'
  currency_name_ar text not null,             -- 'ليرة تركية', 'جنيه مصري'
  phone_code text not null,                   -- '+90', '+20'
  phone_placeholder text not null default '', -- '555 123 45 67'
  iban_regex text,                            -- regex pattern for IBAN validation
  iban_placeholder text,                      -- 'TR00 0000 0000 0000 0000 00'
  timezone text not null default 'UTC',
  is_active boolean not null default true,
  sort_order int not null default 0,
  -- Subscription pricing for this country
  subscription_growth_price numeric not null default 0,
  subscription_professional_price numeric not null default 0,
  subscription_growth_founder_price numeric not null default 0,
  subscription_professional_founder_price numeric not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table countries enable row level security;

-- Everyone can read countries
drop policy if exists "Countries are viewable by everyone" on countries;
create policy "Countries are viewable by everyone" on countries for select using (true);

-- 1.2 CITIES
create table if not exists cities (
  id text primary key,                        -- 'istanbul', 'cairo', etc.
  country_id text not null references countries(id) on delete cascade,
  name_en text not null,
  name_ar text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now()
);
create index if not exists idx_cities_country_id on cities(country_id);
alter table cities enable row level security;

drop policy if exists "Cities are viewable by everyone" on cities;
create policy "Cities are viewable by everyone" on cities for select using (true);

-- 1.3 BANKS
create table if not exists banks (
  id uuid default gen_random_uuid() primary key,
  country_id text not null references countries(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now()
);
create index if not exists idx_banks_country_id on banks(country_id);
alter table banks enable row level security;

drop policy if exists "Banks are viewable by everyone" on banks;
create policy "Banks are viewable by everyone" on banks for select using (true);

-- 1.4 PAYMENT METHODS — Available payment methods per country
-- Each row defines a payment method TYPE and what fields a vendor must provide
create table if not exists payment_methods (
  id uuid default gen_random_uuid() primary key,
  country_id text not null references countries(id) on delete cascade,
  method_type text not null,                  -- 'bank_transfer', 'mobile_wallet', 'payment_link'
  label_en text not null,                     -- 'Bank Transfer', 'Vodafone Cash'
  label_ar text not null,
  description_en text,
  description_ar text,
  icon text default 'building',               -- lucide icon name
  required_fields jsonb not null default '[]', -- e.g. ["bank_name","iban","account_holder"]
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now()
);
create index if not exists idx_payment_methods_country_id on payment_methods(country_id);
alter table payment_methods enable row level security;

drop policy if exists "Payment methods are viewable by everyone" on payment_methods;
create policy "Payment methods are viewable by everyone" on payment_methods for select using (true);

-- 1.5 VENDOR PAYMENT METHODS — Which methods a vendor accepts + their details
create table if not exists vendor_payment_methods (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid not null references vendors(id) on delete cascade,
  payment_method_id uuid not null references payment_methods(id) on delete cascade,
  details jsonb not null default '{}',        -- vendor-specific values matching required_fields
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(vendor_id, payment_method_id)
);
create index if not exists idx_vendor_payment_methods_vendor_id on vendor_payment_methods(vendor_id);
alter table vendor_payment_methods enable row level security;

-- Vendors can see their own, public can see active ones for booking
drop policy if exists "Vendor payment methods are viewable by everyone" on vendor_payment_methods;
create policy "Vendor payment methods are viewable by everyone" on vendor_payment_methods for select using (true);
drop policy if exists "Vendors can manage own payment methods" on vendor_payment_methods;
create policy "Vendors can manage own payment methods" on vendor_payment_methods for all using (auth.uid() = vendor_id);

-- -----------------------------------------------------------------------------
-- 2. SCHEMA MODIFICATIONS
-- -----------------------------------------------------------------------------

-- 2.1 Add country column to vendors (if not exists)
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'vendors' and column_name = 'country'
  ) then
    alter table vendors add column country text references countries(id);
  end if;
end $$;

-- 2.2 Add currency column to bookings
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'bookings' and column_name = 'currency'
  ) then
    alter table bookings add column currency text default 'TRY';
  end if;
end $$;

-- 2.3 Add currency column to tickets
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'tickets' and column_name = 'currency'
  ) then
    alter table tickets add column currency text default 'TRY';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 3. SEED DATA
-- -----------------------------------------------------------------------------

-- 3.1 COUNTRIES
insert into countries (id, name_en, name_ar, currency_code, currency_symbol, currency_name_ar,
  phone_code, phone_placeholder, iban_regex, iban_placeholder, timezone, is_active, sort_order,
  subscription_growth_price, subscription_professional_price,
  subscription_growth_founder_price, subscription_professional_founder_price)
values
  ('tr', 'Turkey', 'تركيا', 'TRY', '₺', 'ليرة تركية',
   '+90', '555 123 45 67', '^TR[0-9]{2}[0-9]{4}[A-Z0-9]{17}$', 'TR00 0000 0000 0000 0000 00',
   'Europe/Istanbul', true, 1,
   999, 1999, 499, 999),
  ('eg', 'Egypt', 'مصر', 'EGP', 'ج.م', 'جنيه مصري',
   '+20', '101 234 5678', '^EG[0-9]{2}[0-9]{23}$', 'EG00 0000 0000 0000 0000 0000 000',
   'Africa/Cairo', true, 2,
   1500, 3000, 750, 1500)
on conflict (id) do nothing;

-- 3.2 CITIES — Turkey
insert into cities (id, country_id, name_en, name_ar, sort_order) values
  ('istanbul', 'tr', 'Istanbul', 'إسطنبول', 1),
  ('ankara', 'tr', 'Ankara', 'أنقرة', 2),
  ('izmir', 'tr', 'Izmir', 'إزمير', 3),
  ('antalya', 'tr', 'Antalya', 'أنطاليا', 4),
  ('bursa', 'tr', 'Bursa', 'بورصة', 5)
on conflict (id) do nothing;

-- 3.3 CITIES — Egypt
insert into cities (id, country_id, name_en, name_ar, sort_order) values
  ('cairo', 'eg', 'Cairo', 'القاهرة', 1),
  ('alexandria', 'eg', 'Alexandria', 'الإسكندرية', 2),
  ('giza', 'eg', 'Giza', 'الجيزة', 3),
  ('sharm-el-sheikh', 'eg', 'Sharm El Sheikh', 'شرم الشيخ', 4),
  ('hurghada', 'eg', 'Hurghada', 'الغردقة', 5),
  ('mansoura', 'eg', 'Mansoura', 'المنصورة', 6)
on conflict (id) do nothing;

-- 3.4 BANKS — Turkey
insert into banks (country_id, name, sort_order) values
  ('tr', 'Akbank', 1),
  ('tr', 'Albaraka Türk', 2),
  ('tr', 'Alternatifbank', 3),
  ('tr', 'Anadolubank', 4),
  ('tr', 'Burgan Bank', 5),
  ('tr', 'Denizbank', 6),
  ('tr', 'Fibabanka', 7),
  ('tr', 'Garanti BBVA', 8),
  ('tr', 'Halkbank', 9),
  ('tr', 'HSBC Turkey', 10),
  ('tr', 'ING Bank', 11),
  ('tr', 'İş Bankası', 12),
  ('tr', 'Kuveyt Türk', 13),
  ('tr', 'Odeabank', 14),
  ('tr', 'QNB Finansbank', 15),
  ('tr', 'Şekerbank', 16),
  ('tr', 'Turkish Bank', 17),
  ('tr', 'Türk Ekonomi Bankası (TEB)', 18),
  ('tr', 'Türkiye Finans', 19),
  ('tr', 'Vakıfbank', 20),
  ('tr', 'Yapı Kredi', 21),
  ('tr', 'Ziraat Bankası', 22);

-- 3.5 BANKS — Egypt
insert into banks (country_id, name, sort_order) values
  ('eg', 'National Bank of Egypt (NBE)', 1),
  ('eg', 'Banque Misr', 2),
  ('eg', 'Commercial International Bank (CIB)', 3),
  ('eg', 'QNB Al Ahli', 4),
  ('eg', 'HSBC Egypt', 5),
  ('eg', 'Banque du Caire', 6),
  ('eg', 'Arab African International Bank', 7),
  ('eg', 'Faisal Islamic Bank', 8),
  ('eg', 'Alex Bank', 9),
  ('eg', 'Abu Dhabi Islamic Bank (ADIB)', 10);

-- 3.6 PAYMENT METHODS — Turkey
insert into payment_methods (country_id, method_type, label_en, label_ar, description_en, description_ar, icon, required_fields, sort_order)
values
  ('tr', 'bank_transfer', 'Bank Transfer', 'تحويل بنكي',
   'Transfer to vendor bank account', 'تحويل إلى الحساب البنكي للمنظم',
   'building', '["bank_name", "iban", "account_holder"]'::jsonb, 1);

-- 3.7 PAYMENT METHODS — Egypt
insert into payment_methods (country_id, method_type, label_en, label_ar, description_en, description_ar, icon, required_fields, sort_order)
values
  ('eg', 'bank_transfer', 'Bank Transfer', 'تحويل بنكي',
   'Transfer to vendor bank account', 'تحويل إلى الحساب البنكي للمنظم',
   'building', '["bank_name", "account_number", "account_holder"]'::jsonb, 1),
  ('eg', 'mobile_wallet', 'Vodafone Cash', 'فودافون كاش',
   'Send to vendor mobile wallet', 'إرسال إلى محفظة المنظم الإلكترونية',
   'smartphone', '["phone_number", "wallet_provider"]'::jsonb, 2),
  ('eg', 'payment_link', 'InstaPay / Payment Link', 'إنستاباي / رابط دفع',
   'Pay via vendor payment link', 'ادفع عبر رابط الدفع الخاص بالمنظم',
   'link', '["payment_url", "provider_name"]'::jsonb, 3);

-- -----------------------------------------------------------------------------
-- 4. BACKFILL EXISTING DATA
-- -----------------------------------------------------------------------------

-- 4.1 Backfill events.country
update events set country = 'tr' where country is null;

-- 4.2 Backfill profiles.country
update profiles set country = 'tr' where country is null;

-- 4.3 Backfill vendors.country
update vendors set country = 'tr' where country is null;

-- 4.4 Migrate existing vendor bank info to vendor_payment_methods
-- For vendors that have bank info, create a vendor_payment_methods entry
insert into vendor_payment_methods (vendor_id, payment_method_id, details, is_active)
select
  v.id,
  pm.id,
  jsonb_build_object(
    'bank_name', coalesce(v.bank_name, ''),
    'iban', coalesce(v.bank_iban, ''),
    'account_holder', coalesce(v.bank_account_name, '')
  ),
  true
from vendors v
cross join payment_methods pm
where pm.country_id = 'tr'
  and pm.method_type = 'bank_transfer'
  and (v.bank_name is not null or v.bank_iban is not null or v.bank_account_name is not null)
on conflict (vendor_id, payment_method_id) do nothing;

-- -----------------------------------------------------------------------------
-- 5. UPDATE get_events_pro TO SUPPORT COUNTRY FILTER
-- -----------------------------------------------------------------------------

create or replace function get_events_pro(
  p_lat float default null,
  p_long float default null,
  p_radius_km float default null,
  p_category text default null,
  p_min_price float default null,
  p_max_price float default null,
  p_search text default null,
  p_date_start timestamptz default null,
  p_date_end timestamptz default null,
  p_limit int default 50,
  p_offset int default 0,
  p_country text default null
)
returns table (
  id uuid, vendor_id uuid, title text, description text, image_url text,
  price numeric, date timestamptz, status text, event_type text,
  category_id uuid, category_name_en text, category_name_ar text,
  category_slug text, category_icon text, capacity int,
  location_name text, location_lat float, location_long float,
  district text, city text, country text, dist_km float,
  vendor_name text, vendor_logo text, slug text
)
language plpgsql as $$
begin
  return query
  select
    e.id, e.vendor_id, e.title, e.description, e.image_url,
    coalesce((select min(t.price) from tickets t where t.event_id = e.id), 0) as price,
    e.date, e.status, e.event_type,
    c.id as category_id, c.name_en as category_name_en,
    c.name_ar as category_name_ar, c.slug as category_slug,
    c.icon as category_icon, e.capacity, e.location_name,
    e.location_lat, e.location_long, e.district, e.city, e.country,
    case
      when p_lat is not null and p_long is not null
           and e.location_lat is not null and e.location_long is not null then
        6371 * acos(least(1.0, greatest(-1.0,
          cos(radians(p_lat)) * cos(radians(e.location_lat)) *
          cos(radians(e.location_long) - radians(p_long)) +
          sin(radians(p_lat)) * sin(radians(e.location_lat))
        )))
      else null::float
    end as dist_km,
    v.business_name as vendor_name,
    v.company_logo as vendor_logo,
    e.slug
  from events e
  join vendors v on e.vendor_id = v.id
  left join categories c on e.category_id = c.id
  where
    e.status = 'published'
    and (p_country is null or e.country = p_country)
    and (p_category is null or c.slug = p_category or e.event_type = p_category)
    and (p_search is null or e.title ilike '%' || p_search || '%')
    and (p_date_start is null or e.date >= p_date_start)
    and (p_date_end is null or e.date <= p_date_end)
    and (
      p_lat is null or p_long is null or p_radius_km is null or
      6371 * acos(least(1.0, greatest(-1.0,
        cos(radians(p_lat)) * cos(radians(e.location_lat)) *
        cos(radians(e.location_long) - radians(p_long)) +
        sin(radians(p_lat)) * sin(radians(e.location_lat))
      ))) <= p_radius_km
    )
  group by e.id, v.id, c.id
  having
    (p_min_price is null or coalesce((select min(t.price) from tickets t where t.event_id = e.id), 0) >= p_min_price)
    and (p_max_price is null or coalesce((select min(t.price) from tickets t where t.event_id = e.id), 0) <= p_max_price)
  order by
    case when p_lat is not null then
      case
        when p_lat is not null and p_long is not null
             and e.location_lat is not null and e.location_long is not null then
          6371 * acos(least(1.0, greatest(-1.0,
            cos(radians(p_lat)) * cos(radians(e.location_lat)) *
            cos(radians(e.location_long) - radians(p_long)) +
            sin(radians(p_lat)) * sin(radians(e.location_lat))
          )))
        else null::float
      end
    end asc,
    e.date asc
  limit p_limit offset p_offset;
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. TABLE COMMENTS
-- -----------------------------------------------------------------------------
comment on table countries is 'Master country configuration — currency, phone, IBAN, subscription pricing';
comment on table cities is 'Cities per country, managed from admin dashboard';
comment on table banks is 'Banks per country, used in vendor payment setup';
comment on table payment_methods is 'Available payment method types per country with required field definitions';
comment on table vendor_payment_methods is 'Junction: which payment methods a vendor accepts and their specific details';
comment on column payment_methods.required_fields is 'JSON array of field keys the vendor must fill: e.g. ["bank_name","iban","account_holder"]';
comment on column vendor_payment_methods.details is 'JSON object with vendor values matching payment_methods.required_fields';
