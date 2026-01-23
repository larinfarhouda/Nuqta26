-- Event Reviews System Migration
-- Creates tables, RLS policies, and functions for event review/rating functionality

-- 1. Create event_reviews table
create table if not exists event_reviews (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete set null,
  booking_id uuid references bookings(id) on delete set null,
  rating int not null check (rating >= 1 and rating <= 5),
  comment text,
  is_flagged boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Ensure one review per user per event
  unique(event_id, user_id)
);

-- Create indexes for performance
create index idx_event_reviews_event_id on event_reviews(event_id);
create index idx_event_reviews_user_id on event_reviews(user_id);
create index idx_event_reviews_created_at on event_reviews(created_at desc);

-- 2. Create review_helpful table for helpful votes
create table if not exists review_helpful (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references event_reviews(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  is_helpful boolean not null,
  created_at timestamptz default now(),
  
  -- Ensure one vote per user per review
  unique(review_id, user_id)
);

-- Create indexes
create index idx_review_helpful_review_id on review_helpful(review_id);
create index idx_review_helpful_user_id on review_helpful(user_id);

-- 3. Enable RLS on new tables
alter table event_reviews enable row level security;
alter table review_helpful enable row level security;

-- 4. RLS Policies for event_reviews

-- Anyone can view non-flagged reviews
drop policy if exists "Reviews are publicly viewable" on event_reviews;
create policy "Reviews are publicly viewable"
  on event_reviews for select
  using ( true );

-- Authenticated users who have a booking for the event can insert reviews
-- Only after the event has passed
drop policy if exists "Users who attended can review" on event_reviews;
create policy "Users who attended can review"
  on event_reviews for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from bookings b
      join events e on b.event_id = e.id
      where b.user_id = auth.uid()
        and b.event_id = event_reviews.event_id
        and e.date < now()
        and b.status = 'confirmed'
    )
  );

-- Users can update their own reviews
drop policy if exists "Users can update own reviews" on event_reviews;
create policy "Users can update own reviews"
  on event_reviews for update
  using ( auth.uid() = user_id );

-- Users can delete their own reviews
drop policy if exists "Users can delete own reviews" on event_reviews;
create policy "Users can delete own reviews"
  on event_reviews for delete
  using ( auth.uid() = user_id );

-- 5. RLS Policies for review_helpful

-- Anyone can view helpful votes
drop policy if exists "Helpful votes are viewable" on review_helpful;
create policy "Helpful votes are viewable"
  on review_helpful for select
  using ( true );

-- Authenticated users can mark reviews as helpful
drop policy if exists "Users can vote helpful" on review_helpful;
create policy "Users can vote helpful"
  on review_helpful for insert
  with check ( auth.uid() = user_id );

-- Users can update their helpful votes
drop policy if exists "Users can update helpful votes" on review_helpful;
create policy "Users can update helpful votes"
  on review_helpful for update
  using ( auth.uid() = user_id );

-- Users can delete their helpful votes
drop policy if exists "Users can delete helpful votes" on review_helpful;
create policy "Users can delete helpful votes"
  on review_helpful for delete
  using ( auth.uid() = user_id );

-- 6. Database Functions

-- Function to get event average rating and count
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

-- Function to check if a user can review an event
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

-- Function to get helpful count for a review
create or replace function get_review_helpful_count(p_review_id uuid)
returns table (
  helpful_count bigint,
  not_helpful_count bigint
)
language plpgsql
as $$
begin
  return query
  select
    count(*) filter (where is_helpful = true)::bigint as helpful_count,
    count(*) filter (where is_helpful = false)::bigint as not_helpful_count
  from review_helpful
  where review_id = p_review_id;
end;
$$;

-- 7. Add trigger to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_event_reviews_updated_at on event_reviews;
create trigger update_event_reviews_updated_at
  before update on event_reviews
  for each row
  execute function update_updated_at_column();
