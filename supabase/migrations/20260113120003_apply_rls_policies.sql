-- Enable RLS on all tables
alter table profiles enable row level security;
alter table vendors enable row level security;
alter table categories enable row level security;
alter table events enable row level security;
alter table tickets enable row level security;
alter table bookings enable row level security;
alter table favorite_events enable row level security;

-- PROFILES Policies
drop policy if exists "Public profiles are viewable by everyone" on profiles;
create policy "Public profiles are viewable by everyone" 
  on profiles for select using (true);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" 
  on profiles for update using (auth.uid() = id);

-- VENDORS Policies
drop policy if exists "Vendors are viewable by everyone" on vendors;
create policy "Vendors are viewable by everyone" 
  on vendors for select using (true);

drop policy if exists "Vendors can update own profile" on vendors;
create policy "Vendors can update own profile" 
  on vendors for update using (auth.uid() = id);

-- CATEGORIES Policies
drop policy if exists "Categories are viewable by everyone" on categories;
create policy "Categories are viewable by everyone" 
  on categories for select using (true);

-- EVENTS Policies
drop policy if exists "Published events are viewable by everyone" on events;
create policy "Published events are viewable by everyone" 
  on events for select using (status = 'published');

drop policy if exists "Vendors can manage own events" on events;
create policy "Vendors can manage own events" 
  on events for all using (auth.uid() = vendor_id);

drop policy if exists "Vendors can view own events" on events;
create policy "Vendors can view own events"
  on events for select using (auth.uid() = vendor_id);

-- TICKETS Policies
drop policy if exists "Tickets are viewable by everyone" on tickets;
create policy "Tickets are viewable by everyone" 
  on tickets for select using (true);

drop policy if exists "Vendors can manage own event tickets" on tickets;
create policy "Vendors can manage own event tickets" 
  on tickets for all using (
    exists (select 1 from events where events.id = tickets.event_id and events.vendor_id = auth.uid())
  );

-- BOOKINGS Policies
drop policy if exists "Users can view own bookings" on bookings;
create policy "Users can view own bookings" 
  on bookings for select using (auth.uid() = user_id);

drop policy if exists "Vendors can view bookings for their events" on bookings;
create policy "Vendors can view bookings for their events" 
  on bookings for select using (auth.uid() = vendor_id);

-- FAVORITE EVENTS Policies
drop policy if exists "Users can manage own favorites" on favorite_events;
create policy "Users can manage own favorites" 
  on favorite_events for all using (auth.uid() = user_id);
