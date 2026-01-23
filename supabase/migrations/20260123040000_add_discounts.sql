create extension if not exists "uuid-ossp";

-- Create discount_codes table
create table if not exists discount_codes (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid references vendors(id) on delete cascade not null,
  event_id uuid references events(id) on delete cascade, -- Optional: if null, code applies to all vendor events
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

-- Create bulk_discounts table
create table if not exists bulk_discounts (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade not null,
  min_quantity int not null,
  discount_type text check (discount_type in ('percentage', 'fixed')) not null,
  discount_value numeric not null,
  created_at timestamptz default now()
);

-- Update bookings table to track discounts
alter table bookings add column if not exists discount_code_id uuid references discount_codes(id) on delete set null;
alter table bookings add column if not exists discount_amount numeric default 0;

-- Enable RLS
alter table discount_codes enable row level security;
alter table bulk_discounts enable row level security;

-- Policies for discount_codes
-- DROP if exists to avoid conflicts if re-run
drop policy if exists "Vendors can manage own discount codes" on discount_codes;
create policy "Vendors can manage own discount codes" on discount_codes
  for all using (auth.uid() = vendor_id);

drop policy if exists "Public can view active discount codes" on discount_codes;
create policy "Public can view active discount codes" on discount_codes
  for select using (is_active = true and (expiry_date is null or expiry_date > now()));

-- Policies for bulk_discounts
drop policy if exists "Vendors can manage own bulk discounts" on bulk_discounts;
create policy "Vendors can manage own bulk discounts" on bulk_discounts
  for all using (
    exists (
      select 1 from events
      where events.id = bulk_discounts.event_id
      and events.vendor_id = auth.uid()
    )
  );

drop policy if exists "Public can view bulk discounts" on bulk_discounts;
create policy "Public can view bulk discounts" on bulk_discounts
  for select using (true);
