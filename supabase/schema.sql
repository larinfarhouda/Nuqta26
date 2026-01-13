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

-- RLS Suggestion:
-- alter table profiles enable row level security;
-- create policy "Public profiles are viewable by everyone" on profiles for select using (true);
-- create policy "Users can update own profile" on profiles for update using (auth.uid() = id);


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
  
  created_at timestamptz default now()
);

-- RLS Suggestion:
-- alter table tickets enable row level security;
-- create policy "Tickets are viewable by everyone" on tickets for select using (true);
-- create policy "Vendors can manage own event tickets" on tickets for all using (
--   exists (select 1 from events where events.id = tickets.event_id and events.vendor_id = auth.uid())
-- );


-- BOOKINGS
create table if not exists bookings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete set null, -- User who booked
  event_id uuid references events(id) on delete restrict, -- Event booked
  vendor_id uuid references vendors(id) on delete restrict, -- Vendor (denormalized for easier querying by vendor)
  
  status text default 'confirmed', -- 'confirmed', 'cancelled', 'pending'
  total_amount numeric default 0,
  
  -- Ideally linking to specific tickets:
  -- ticket_id uuid references tickets(id), 
  -- quantity int, 
  -- OR if multiple ticket types per booking allowed, use a separate booking_items table.
  -- Based on current code loops, it seems bookings might be 1:1 with ticket types or aggregated?
  -- Assuming simple structure for now based on 'bookings' join in 'getVendorBookings'
  
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
  vendor_logo text
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
    v.company_logo as vendor_logo
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
    (p_min_price is null or coalesce(min((select t.price from tickets t where t.event_id = e.id limit 1)), 0) >= p_min_price)
    and (p_max_price is null or coalesce(min((select t.price from tickets t where t.event_id = e.id limit 1)), 0) <= p_max_price)
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
