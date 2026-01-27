-- Superbase Consolidated Schema
-- This file represents the ideal structure of the database.
-- It consolidates all previous migrations and the existing schema.sql.

-- -----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- -----------------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 2. ENUMS & TYPES (Optional, usually we use text with check constraints)
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- 3. TABLES
-- -----------------------------------------------------------------------------

-- 3.1 PROFILES
-- Link to auth.users.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  age int,
  gender text,
  country text,
  city text,
  district text,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- RLS: Enabled
alter table profiles enable row level security;
-- Policies defined below.

-- 3.2 VENDORS
-- Represents event organizers/vendors.
create table if not exists vendors (
  id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null,
  company_logo text,
  cover_image text, -- From migration: add_vendor_cover
  phone text,
  slug text unique, -- From migration: add_vendor_slugs
  
  -- Bank Details (From migration: add_bank_transfer_fields)
  bank_name text,
  bank_account_name text,
  bank_iban text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists vendors_slug_idx on vendors (slug);
-- RLS: Should be enabled.
alter table vendors enable row level security;

-- 3.3 CATEGORIES
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  name_en text not null,
  name_ar text,
  icon text,
  created_at timestamptz default now()
);
-- RLS: Should be enabled to allow public read, admin write.
alter table categories enable row level security;

-- 3.4 EVENTS
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid references vendors(id) on delete cascade not null, -- FK: Link to Vendor
  category_id uuid references categories(id) on delete set null,    -- FK: Link to Category
  
  title text not null,
  slug text unique,
  description text,
  image_url text,
  
  -- Date & Time
  date timestamptz not null,
  end_date timestamptz,
  
  -- Recurrence
  is_recurring boolean default false,
  recurrence_type text, -- 'daily', 'weekly', etc.
  recurrence_days jsonb, -- e.g. ["Monday", "Wednesday"]
  recurrence_end_date timestamptz,
  
  -- Location
  location_name text,
  location_lat float,
  location_long float,
  district text,
  city text,
  country text,
  
  capacity int,
  status text default 'draft', -- 'draft', 'published', 'cancelled'
  event_type text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- RLS: Enabled. Public read (published), Vendor write (own events).
alter table events enable row level security;

-- 3.5 TICKETS
create table if not exists tickets (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade not null, -- FK: Link to Event
  name text not null,
  price numeric not null default 0,
  quantity int not null,
  sold int default 0,
  
  created_at timestamptz default now(),
  constraint tickets_sold_check check (sold >= 0 and sold <= quantity)
);
create index if not exists idx_tickets_event_id on tickets(event_id);
-- RLS: Enabled. Public read, Vendor write (own).
alter table tickets enable row level security;

-- 3.6 DISCOUNT CODES (From migration: add_discounts)
create table if not exists discount_codes (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid references vendors(id) on delete cascade not null, -- FK: Link to Vendor
  event_id uuid references events(id) on delete cascade,            -- FK: Specific event (optional)
  code text not null,
  discount_type text check (discount_type in ('percentage', 'fixed')) not null,
  discount_value numeric not null,
  min_purchase_amount numeric default 0,
  max_uses int,
  used_count int default 0,
  is_active boolean default true,
  expiry_date timestamptz,
  created_at timestamptz default now(),
  unique(vendor_id, code)
);
-- RLS: Enabled. Vendor manage own, Public view active.
alter table discount_codes enable row level security;

-- 3.7 BULK DISCOUNTS (From migration: add_discounts)
create table if not exists bulk_discounts (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade not null, -- FK: Link to Event
  min_quantity int not null,
  discount_type text check (discount_type in ('percentage', 'fixed')) not null,
  discount_value numeric not null,
  created_at timestamptz default now()
);
-- RLS: Enabled. Vendor manage own, Public view.
alter table bulk_discounts enable row level security;

-- 3.8 BOOKINGS
create table if not exists bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete set null,  -- FK: Link to User
  event_id uuid references events(id) on delete restrict,   -- FK: Link to Event
  vendor_id uuid references vendors(id) on delete restrict, -- FK: Link to Vendor (denormalized)
  
  discount_code_id uuid references discount_codes(id) on delete set null, -- FK: Link to Discount
  
  status text default 'confirmed', -- 'confirmed', 'cancelled', 'pending_payment', 'payment_submitted'
  total_amount numeric default 0,
  discount_amount numeric default 0,
  
  -- Payment Details (From migration: add_bank_transfer_fields)
  payment_method text default 'bank_transfer',
  payment_proof_url text,
  payment_note text,
  
  created_at timestamptz default now()
);
-- RLS: Enabled. User view own, Vendor view own events' bookings.
alter table bookings enable row level security;

-- 3.9 BOOKING ITEMS
create table if not exists booking_items (
  id uuid default gen_random_uuid() primary key,
  booking_id uuid references bookings(id) on delete cascade not null, -- FK: Link to Booking
  ticket_id uuid references tickets(id) on delete set null,           -- FK: Link to Ticket
  attendee_name text,
  attendee_email text,
  price_at_booking numeric,
  status text default 'active',
  created_at timestamptz default now()
);
-- RLS: Implicitly managed via booking access usually, or explicit RLS.

-- 3.10 FAVORITE EVENTS
create table if not exists favorite_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null, -- FK: Link to User
  event_id uuid references events(id) on delete cascade not null,  -- FK: Link to Event
  created_at timestamptz default now(),
  unique(user_id, event_id)
);
-- RLS: Enabled. User manage own.
alter table favorite_events enable row level security;

-- 3.11 EVENT REVIEWS (From migration: add_event_reviews)
create table if not exists event_reviews (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade not null, -- FK: Link to Event
  user_id uuid references profiles(id) on delete set null,        -- FK: Link to User
  booking_id uuid references bookings(id) on delete set null,     -- FK: Link to Booking (verified purchase)
  rating int not null check (rating >= 1 and rating <= 5),
  comment text,
  is_flagged boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(event_id, user_id)
);
create index if not exists idx_event_reviews_event_id on event_reviews(event_id);
create index if not exists idx_event_reviews_user_id on event_reviews(user_id);
-- RLS: Enabled. Public view (non-flagged), Users insert (if attended), Users update/delete own.
alter table event_reviews enable row level security;

-- 3.12 REVIEW HELPFUL (From migration: add_event_reviews)
create table if not exists review_helpful (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references event_reviews(id) on delete cascade not null, -- FK: Link to Review
  user_id uuid references profiles(id) on delete cascade not null,        -- FK: Link to User
  is_helpful boolean not null,
  created_at timestamptz default now(),
  unique(review_id, user_id)
);
-- RLS: Enabled. Public view, Auth users vote.
alter table review_helpful enable row level security;

-- 3.13 REVIEW FLAGS (From migration: add_event_reviews / schema)
create table if not exists review_flags (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references event_reviews(id) on delete cascade, -- FK: Link to Review
  user_id uuid not null references profiles(id) on delete cascade,        -- FK: Link to User
  reason text,
  created_at timestamptz default now(),
  unique(review_id, user_id)
);
-- RLS: Enabled. User view own, User insert own.
alter table review_flags enable row level security;
drop policy if exists "User view own flags" on review_flags;
create policy "User view own flags" on review_flags for select using (auth.uid() = user_id);
drop policy if exists "User insert own flags" on review_flags;
create policy "User insert own flags" on review_flags for insert with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4. STORAGE
-- -----------------------------------------------------------------------------
-- Bucket: booking-receipts
insert into storage.buckets (id, name, public)
values ('booking-receipts', 'booking-receipts', true)
on conflict (id) do nothing;
-- RLS for storage should be handled in Supabase dashboard or via policies below.

-- -----------------------------------------------------------------------------
-- 5. RLS POLICIES (Consolidated Suggestions)
-- -----------------------------------------------------------------------------

-- Profiles
drop policy if exists "Public profiles are viewable by everyone" on profiles;
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Vendors
drop policy if exists "Vendors are viewable by everyone" on vendors;
create policy "Vendors are viewable by everyone" on vendors for select using (true);
drop policy if exists "Vendors can update own profile" on vendors;
create policy "Vendors can update own profile" on vendors for update using (auth.uid() = id);

-- Categories
drop policy if exists "Categories are viewable by everyone" on categories;
create policy "Categories are viewable by everyone" on categories for select using (true);

-- Events
drop policy if exists "Published events are viewable by everyone" on events;
create policy "Published events are viewable by everyone" on events for select using (status = 'published');
drop policy if exists "Vendors can manage own events" on events;
create policy "Vendors can manage own events" on events for all using (auth.uid() = vendor_id);

-- Tickets
drop policy if exists "Tickets are viewable by everyone" on tickets;
create policy "Tickets are viewable by everyone" on tickets for select using (true);
drop policy if exists "Vendors can manage own event tickets" on tickets;
create policy "Vendors can manage own event tickets" on tickets for all using (
  exists (select 1 from events where events.id = tickets.event_id and events.vendor_id = auth.uid())
);

-- Bookings
drop policy if exists "Users can view own bookings" on bookings;
create policy "Users can view own bookings" on bookings for select using (auth.uid() = user_id);
drop policy if exists "Vendors can view bookings for their events" on bookings;
create policy "Vendors can view bookings for their events" on bookings for select using (auth.uid() = vendor_id);

-- Reviews
drop policy if exists "Reviews are publicly viewable" on event_reviews;
create policy "Reviews are publicly viewable" on event_reviews for select using (true);
drop policy if exists "Users can update own reviews" on event_reviews;
create policy "Users can update own reviews" on event_reviews for update using (auth.uid() = user_id);
-- Note: Insert policy is complex (validation of attendance), see Functions section or migration.

-- -----------------------------------------------------------------------------
-- 6. FUNCTIONS & TRIGGERS
-- -----------------------------------------------------------------------------

-- 6.1 Profile Management triggers
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.handle_user_update()
returns trigger as $$
begin
  update public.profiles
  set email = new.email,
      full_name = coalesce(new.raw_user_meta_data->>'full_name', full_name),
      avatar_url = coalesce(new.raw_user_meta_data->>'avatar_url', avatar_url),
      updated_at = now()
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update on auth.users
  for each row execute procedure public.handle_user_update();

-- 6.2 Advanced Event Search (get_events_pro)
-- Consolidates location search, filtering, and joining data.
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
  p_offset int default 0
)
returns table (
  id uuid,
  vendor_id uuid,
  title text,
  description text,
  image_url text,
  price numeric,
  date timestamptz,
  status text,
  event_type text, 
  category_id uuid,
  category_name_en text,
  category_name_ar text,
  category_slug text,
  category_icon text,
  capacity int,
  location_name text,
  location_lat float,
  location_long float,
  district text,
  city text,
  country text,
  dist_km float,
  vendor_name text,
  vendor_logo text,
  slug text
)
language plpgsql
as $$
begin
  return query
  select
    e.id,
    e.vendor_id,
    e.title,
    e.description,
    e.image_url,
    coalesce((select min(t.price) from tickets t where t.event_id = e.id), 0) as price,
    e.date,
    e.status,
    e.event_type,
    c.id as category_id,
    c.name_en as category_name_en,
    c.name_ar as category_name_ar,
    c.slug as category_slug,
    c.icon as category_icon,
    e.capacity,
    e.location_name,
    e.location_lat,
    e.location_long,
    e.district,
    e.city,
    e.country,
    case
      when p_lat is not null and p_long is not null and e.location_lat is not null and e.location_long is not null then
        (
          6371 * acos(
            least(1.0, greatest(-1.0,
              cos(radians(p_lat)) * cos(radians(e.location_lat)) * cos(radians(e.location_long) - radians(p_long)) +
              sin(radians(p_lat)) * sin(radians(e.location_lat))
            ))
          )
        )
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
    and (p_category is null or c.slug = p_category or e.event_type = p_category)
    and (p_search is null or e.title ilike '%' || p_search || '%')
    and (p_date_start is null or e.date >= p_date_start)
    and (p_date_end is null or e.date <= p_date_end)
    and (
      p_lat is null or p_long is null or p_radius_km is null or
      (
        6371 * acos(
          least(1.0, greatest(-1.0,
            cos(radians(p_lat)) * cos(radians(e.location_lat)) * cos(radians(e.location_long) - radians(p_long)) +
            sin(radians(p_lat)) * sin(radians(e.location_lat))
          ))
        )
      ) <= p_radius_km
    )
  group by e.id, v.id, c.id
  having
    (p_min_price is null or coalesce((select min(t.price) from tickets t where t.event_id = e.id), 0) >= p_min_price)
    and (p_max_price is null or coalesce((select min(t.price) from tickets t where t.event_id = e.id), 0) <= p_max_price)
  order by
    case when p_lat is not null then 
        case
        when p_lat is not null and p_long is not null and e.location_lat is not null and e.location_long is not null then
            (
            6371 * acos(
                least(1.0, greatest(-1.0,
                cos(radians(p_lat)) * cos(radians(e.location_lat)) * cos(radians(e.location_long) - radians(p_long)) +
                sin(radians(p_lat)) * sin(radians(e.location_lat))
                ))
            )
            )
        else null::float
        end
    end asc,
    e.date asc
  limit p_limit offset p_offset;
end;
$$;

-- 6.3 Transactional Booking (place_booking)
-- Handles inventory check, booking creation, and discount application atomically.
create or replace function place_booking(
  p_event_id uuid,
  p_ticket_id uuid,
  p_quantity int,
  p_user_id uuid,
  p_total_amount numeric,
  p_discount_amount numeric,
  p_discount_code_id uuid default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_booking_id uuid;
  v_available int;
  v_sold int;
  v_capacity int;
  v_current_total_sold int;
  v_vendor_id uuid;
  v_unit_price numeric;
begin
  -- 1. Check ticket availability & unit price
  select quantity, sold, price into v_available, v_sold, v_unit_price from tickets where id = p_ticket_id for update;
  if v_sold + p_quantity > v_available then
    return jsonb_build_object('success', false, 'error', 'Not enough tickets available');
  end if;

  -- 2. Check event capacity
  select vendor_id, capacity into v_vendor_id, v_capacity from events where id = p_event_id for update;
  select coalesce(sum(sold), 0) into v_current_total_sold from tickets where event_id = p_event_id;
  if v_current_total_sold + p_quantity > v_capacity then
    return jsonb_build_object('success', false, 'error', 'Event capacity exceeded');
  end if;

  -- 3. Create booking
  insert into bookings (
    event_id, 
    vendor_id, 
    user_id, 
    total_amount, 
    status,
    discount_amount,
    discount_code_id
  ) values (
    p_event_id,
    v_vendor_id,
    p_user_id,
    p_total_amount,
    case when p_total_amount > 0 then 'pending_payment' else 'confirmed' end,
    p_discount_amount,
    p_discount_code_id
  ) returning id into v_booking_id;

  -- 4. Create booking items
  for i in 1..p_quantity loop
    insert into booking_items (
      booking_id,
      ticket_id,
      price_at_booking
    ) values (
      v_booking_id,
      p_ticket_id,
      v_unit_price
    );
  end loop;

  -- 5. Update ticket sold count immediately if free
  if p_total_amount = 0 then
    update tickets set sold = sold + p_quantity where id = p_ticket_id;
  end if;

  -- 6. Atomically increment discount usage if applicable
  if p_discount_code_id is not null then
    update discount_codes 
    set used_count = used_count + 1 
    where id = p_discount_code_id;
  end if;

  return jsonb_build_object('success', true, 'booking_id', v_booking_id);
end;
$$;

-- 6.4 Review Helper Functions
create or replace function get_event_rating_summary(p_event_id uuid)
returns table (
  average_rating numeric,
  review_count bigint,
  rating_1_count bigint,
  rating_2_count bigint,
  rating_3_count bigint,
  rating_4_count bigint,
  rating_5_count bigint
)
language plpgsql
as $$
begin
  return query
  select
    round(avg(rating)::numeric, 2) as average_rating,
    count(*)::bigint as review_count,
    count(*) filter (where rating = 1)::bigint as rating_1_count,
    count(*) filter (where rating = 2)::bigint as rating_2_count,
    count(*) filter (where rating = 3)::bigint as rating_3_count,
    count(*) filter (where rating = 4)::bigint as rating_4_count,
    count(*) filter (where rating = 5)::bigint as rating_5_count
  from event_reviews
  where event_id = p_event_id;
end;
$$;

create or replace function can_user_review_event(p_user_id uuid, p_event_id uuid)
returns boolean
language plpgsql
as $$
declare
  has_attended boolean;
  already_reviewed boolean;
  event_passed boolean;
begin
  -- Check if user has a confirmed booking
  select exists (
    select 1 from bookings
    where user_id = p_user_id
      and event_id = p_event_id
      and status = 'confirmed'
  ) into has_attended;
  
  -- Check if user already reviewed
  select exists (
    select 1 from event_reviews
    where user_id = p_user_id
      and event_id = p_event_id
  ) into already_reviewed;
  
  -- Check if event has passed
  select exists (
    select 1 from events
    where id = p_event_id
      and date < now()
  ) into event_passed;
  
  return has_attended and not already_reviewed and event_passed;
end;
$$;
