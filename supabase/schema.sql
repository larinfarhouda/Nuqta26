-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS & PROFILES
-- Suggestion: Link this to auth.users via a trigger to auto-create profile on signup
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

-- Enable RLS
alter table profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Trigger to sync email and handle profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

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

create trigger on_auth_user_updated
  after update on auth.users
  for each row execute procedure public.handle_user_update();


-- VENDORS
-- Represents event organizers/vendors. 
-- Suggestion: Link to auth.users similar to profiles, or handle via separate registration flow.
create table if not exists vendors (
  id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null,
  company_logo text,
  phone text,
  -- Add other business details from registration if needed (e.g., tax_id, address)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS Suggestion:
-- alter table vendors enable row level security;
-- create policy "Vendors are viewable by everyone" on vendors for select using (true);
-- create policy "Vendors can update own profile" on vendors for update using (auth.uid() = id);


-- CATEGORIES
create table if not exists categories (
  id uuid default uuid_generate_v4() primary key,
  slug text not null unique,
  name_en text not null,
  name_ar text,
  icon text,
  created_at timestamptz default now()
);

-- RLS Suggestion:
-- alter table categories enable row level security;
-- create policy "Categories are viewable by everyone" on categories for select using (true);
-- create policy "Only admins can insert/update categories" on categories for all using (auth.role() = 'service_role');


-- EVENTS
create table if not exists events (
  id uuid default uuid_generate_v4() primary key,
  vendor_id uuid references vendors(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  
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
  
  -- Location (Denormalized for search performance, or use PostGIS)
  location_name text,
  location_lat float,
  location_long float,
  district text,
  city text,
  country text,
  
  capacity int,
  status text default 'draft', -- 'draft', 'published', 'cancelled'
  event_type text, -- Deprecated in favor of category_id/slug? Kept for backward compatibility if needed.
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS Suggestion:
-- alter table events enable row level security;
-- create policy "Published events are viewable by everyone" on events for select using (status = 'published');
-- create policy "Vendors can manage own events" on events for all using (auth.uid() = vendor_id);


-- TICKETS
create table if not exists tickets (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references events(id) on delete cascade not null,
  name text not null, -- e.g. "General Admission", "VIP"
  price numeric not null default 0,
  quantity int not null, -- Total available for this type
  sold int default 0,
  
  created_at timestamptz default now(),
  constraint tickets_sold_check check (sold >= 0 and sold <= quantity)
);

create index if not exists idx_tickets_event_id on tickets(event_id);

-- RLS Suggestion:
-- alter table tickets enable row level security;
-- create policy "Tickets are viewable by everyone" on tickets for select using (true);
-- create policy "Vendors can manage own event tickets" on tickets for all using (
--   exists (select 1 from events where events.id = tickets.event_id and events.vendor_id = auth.uid())
-- );


create table if not exists bookings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete set null, -- User who booked
  event_id uuid references events(id) on delete restrict, -- Event booked
  vendor_id uuid references vendors(id) on delete restrict, -- Vendor (denormalized for easier querying by vendor)
  
  status text default 'confirmed', -- 'confirmed', 'cancelled', 'pending'
  total_amount numeric default 0,
  
  created_at timestamptz default now()
);

-- BOOKING ITEMS
create table if not exists booking_items (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references bookings(id) on delete cascade not null,
  ticket_id uuid references tickets(id) on delete set null,
  attendee_name text,
  attendee_email text,
  price_at_booking numeric,
  status text default 'active', -- 'active', 'cancelled'
  created_at timestamptz default now()
);

-- RLS Suggestion:
-- alter table bookings enable row level security;
-- create policy "Users can view own bookings" on bookings for select using (auth.uid() = user_id);
-- create policy "Vendors can view bookings for their events" on bookings for select using (auth.uid() = vendor_id);


-- FAVORITE EVENTS
create table if not exists favorite_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  event_id uuid references events(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, event_id)
);

-- RLS Suggestion:
-- alter table favorite_events enable row level security;
-- create policy "Users can manage own favorites" on favorite_events for all using (auth.uid() = user_id);


-- FUNCTIONS

-- Advanced Event Search Function
-- Calculates distance (Haversine), filters by category, date, price, etc.
create or replace function get_events_pro(
  p_lat float default null,
  p_long float default null,
  p_radius_km float default null,
  p_category text default null, -- can be category slug
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
    -- Note: p_search may contain wildcards like % or _ which are intentionally supported for flexible matching
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

-- Batch RPC for Helpful Counts (v2 with user vote check)
create or replace function get_reviews_helpful_counts(p_review_ids uuid[], p_user_id uuid default null)
returns table (
  review_id uuid, 
  helpful_count bigint, 
  not_helpful_count bigint,
  user_voted boolean
)
as $$
  select r.id as review_id, 
         count(h.id) filter (where h.is_helpful = true) as helpful_count,
         count(h.id) filter (where h.is_helpful = false) as not_helpful_count,
         coalesce(bool_or(h.user_id = p_user_id and h.is_helpful = true), false) as user_voted
  from unnest(p_review_ids) as r(id)
  left join review_helpful h on h.review_id = r.id
  group by r.id;
$$ language sql stable;
-- REVIEW FLAGS TABLE
create table if not exists review_flags (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid not null references event_reviews(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  reason text,
  created_at timestamptz default now(),
  unique(review_id, user_id)
);

-- Enable RLS on review_flags
alter table review_flags enable row level security;

-- Policy: Users can see their own flags
create policy "Users can see own flags" on review_flags
  for select using (auth.uid() = user_id);

-- Policy: Users can flag once (insert)
create policy "Users can flag reviews" on review_flags
  for insert with check (auth.uid() = user_id);

-- TRANSACTIONAL BOOKING RPC
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
    status
  ) values (
    p_event_id,
    v_vendor_id,
    p_user_id,
    p_total_amount,
    case when p_total_amount > 0 then 'pending_payment' else 'confirmed' end
  ) returning id into v_booking_id;

  -- Update with additional fields if migrations already applied (softly)
  -- Since we use text for status, we match the text.
  -- Add discount info if columns exist
  update bookings set 
    discount_amount = p_discount_amount,
    discount_code_id = p_discount_code_id
  where id = v_booking_id;

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
