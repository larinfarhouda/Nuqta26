-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. PROFILES (Public Users + Vendors + Admins)
-- -----------------------------------------------------------------------------
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  role text check (role in ('user', 'vendor', 'admin')) default 'user',
  full_name text,
  avatar_url text,
  favorites text[], -- Array of Vendor UUIDs (Consider migrating to a separate table for cleaner relations)
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- -----------------------------------------------------------------------------
-- 2. VENDORS (Business Profiles)
-- -----------------------------------------------------------------------------
create table vendors (
  id uuid references profiles(id) on delete cascade primary key,
  business_name text not null,
  category text not null,
  description_ar text,
  tax_id_document text, -- URL to private bucket
  is_verified boolean default false,
  whatsapp_number text,
  location_lat float,
  location_long float,
  status text check (status in ('pending', 'approved', 'suspended')) default 'approved', -- Default is approved per recent changes
  company_logo text,
  created_at timestamptz default now()
);

alter table vendors enable row level security;

create policy "Vendors are viewable by everyone if approved."
  on vendors for select
  using ( status = 'approved' or auth.uid() = id ); 

create policy "Admins can view all vendors."
  on vendors for select
  using ( exists (select 1 from profiles where id = auth.uid() and role = 'admin') );

create policy "Vendors can insert their own business profile."
  on vendors for insert
  with check ( auth.uid() = id );

create policy "Vendors can update their own business profile."
  on vendors for update
  using ( auth.uid() = id );

-- -----------------------------------------------------------------------------
-- 3. VENDOR GALLERY
-- -----------------------------------------------------------------------------
create table vendor_gallery (
  id uuid default uuid_generate_v4() primary key,
  vendor_id uuid references vendors(id) on delete cascade not null,
  image_url text not null,
  caption text,
  created_at timestamptz default now()
);

alter table vendor_gallery enable row level security;

create policy "Gallery publicly viewable"
  on vendor_gallery for select
  using ( true );

create policy "Vendors manage own gallery"
  on vendor_gallery for all
  using ( auth.uid() = vendor_id );

-- -----------------------------------------------------------------------------
-- 4. EVENTS
-- -----------------------------------------------------------------------------
create table events (
  id uuid default uuid_generate_v4() primary key,
  vendor_id uuid references vendors(id) on delete cascade not null,
  
  -- Basic Details
  title text not null,
  description text,
  image_url text,
  price numeric, -- Base price? (Note: tickets table handles detailed pricing)

  -- Logistics
  date timestamptz not null, -- Start date/time
  end_date timestamptz,
  status text check (status in ('draft', 'published', 'cancelled')) default 'draft',
  event_type text check (event_type in ('workshop', 'meetup', 'bazaar', 'course', 'concert', 'exhibition', 'other')),
  capacity int default 0,
  
  -- Location
  location text, -- Legacy generic field?
  location_name text,
  location_lat float,
  location_long float,
  district text,
  city text,
  country text,
  
  -- Recurrence
  is_recurring boolean default false,
  recurrence_type text check (recurrence_type in ('daily', 'weekly', 'monthly', 'custom')),
  recurrence_days text[], -- e.g. ['sun', 'mon']
  recurrence_end_date timestamptz,
  
  created_at timestamptz default now()
);

alter table events enable row level security;

create policy "Events publicly viewable"
  on events for select
  using ( true );

create policy "Vendors manage own events"
  on events for all
  using ( auth.uid() = vendor_id );

-- -----------------------------------------------------------------------------
-- 5. TICKETS
-- -----------------------------------------------------------------------------
create table tickets (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references events(id) on delete cascade not null,
  name text not null, -- e.g. "VIP", "Early Bird"
  description text,
  price numeric default 0,
  quantity int not null default 0,
  sold int default 0,
  created_at timestamptz default now()
);

alter table tickets enable row level security;

create policy "Public view tickets" 
  on tickets for select 
  using (true);

create policy "Vendors manage tickets" 
  on tickets for all 
  using (
    exists (select 1 from events where events.id = tickets.event_id and events.vendor_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- 6. BOOKINGS
-- -----------------------------------------------------------------------------
create table bookings (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references events(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null, -- Nullable for guest checkout if needed
  vendor_id uuid references vendors(id) on delete cascade not null, -- Denormalized for efficient querying
  
  status text check (status in ('pending', 'confirmed', 'cancelled', 'refunded')) default 'pending',
  total_amount numeric default 0,
  
  -- Contact Info
  contact_name text,
  contact_email text,
  contact_phone text,
  
  created_at timestamptz default now()
);

alter table bookings enable row level security;

create policy "Users view own bookings"
  on bookings for select
  using (auth.uid() = user_id);

create policy "Vendors view own event bookings"
  on bookings for select
  using (auth.uid() = vendor_id);

create policy "Vendors manage own event bookings"
  on bookings for update
  using (auth.uid() = vendor_id);

create policy "Users create bookings"
  on bookings for insert
  with check (auth.uid() = user_id);

-- Indexes for bookings
create index bookings_vendor_id_idx on bookings(vendor_id);
create index bookings_event_id_idx on bookings(event_id);
create index bookings_user_id_idx on bookings(user_id);

-- -----------------------------------------------------------------------------
-- 7. BOOKING ITEMS (Attendees / Specific Tickets)
-- -----------------------------------------------------------------------------
create table booking_items (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references bookings(id) on delete cascade not null,
  ticket_id uuid references tickets(id) on delete set null,
  
  attendee_name text,
  attendee_email text,
  price_at_booking numeric,
  
  status text check (status in ('checked_in', 'pending', 'cancelled')) default 'pending',
  created_at timestamptz default now()
);

alter table booking_items enable row level security;

create policy "Users view own booking items" 
  on booking_items for select 
  using (
    exists (select 1 from bookings where bookings.id = booking_items.booking_id and bookings.user_id = auth.uid())
  );

create policy "Vendors view own booking items" 
  on booking_items for select 
  using (
    exists (select 1 from bookings where bookings.id = booking_items.booking_id and bookings.vendor_id = auth.uid())
  );

create policy "Users create booking items" 
  on booking_items for insert 
  with check (
    exists (select 1 from bookings where bookings.id = booking_items.booking_id and bookings.user_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- 8. FAVORITE EVENTS
-- -----------------------------------------------------------------------------
create table favorite_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  event_id uuid references events(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, event_id)
);

alter table favorite_events enable row level security;

create policy "Users can view their own favorites"
  on favorite_events for select
  using ( auth.uid() = user_id );

create policy "Users can add their own favorites"
  on favorite_events for insert
  with check ( auth.uid() = user_id );

create policy "Users can remove their own favorites"
  on favorite_events for delete
  using ( auth.uid() = user_id );

-- -----------------------------------------------------------------------------
-- 9. FUNCTIONS & TRIGGERS
-- -----------------------------------------------------------------------------
-- Auth Hook for handling new users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 10. STORAGE SETUP
-- -----------------------------------------------------------------------------

-- Create buckets if they don't exist
insert into storage.buckets (id, name, public)
values ('vendor-documents', 'vendor-documents', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('vendor-public', 'vendor-public', true)
on conflict (id) do nothing;

-- Enable RLS on objects
alter table storage.objects enable row level security;

-- Policy: Allow vendors to upload files to their own folder in vendor-documents
create policy "Vendors can upload own documents"
on storage.objects for insert
with check (
  bucket_id = 'vendor-documents' and
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow vendors to update/overwrite own documents
create policy "Vendors can update own documents"
on storage.objects for update
using (
  bucket_id = 'vendor-documents' and
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow vendors to read own documents
create policy "Vendors can read own documents"
on storage.objects for select
using (
  bucket_id = 'vendor-documents' and
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policies for vendor-public
create policy "Public Access to Vendor Public Assets"
  on storage.objects for select
  using ( bucket_id = 'vendor-public' );

create policy "Vendors can upload public assets"
  on storage.objects for insert
  with check (
    bucket_id = 'vendor-public' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Vendors can update public assets"
  on storage.objects for update
  using (
    bucket_id = 'vendor-public' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Vendors can delete public assets"
  on storage.objects for delete
  using (
    bucket_id = 'vendor-public' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
