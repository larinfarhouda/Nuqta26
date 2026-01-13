const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// SQL for Categories Table
const sqlCategories = `
-- 1. Create categories table
create table if not exists categories (
  id uuid default uuid_generate_v4() primary key,
  slug text not null unique,
  name_en text not null,
  name_ar text,
  icon text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table categories enable row level security;

-- Public read access
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'categories' and policyname = 'Categories publicly viewable') then
    create policy "Categories publicly viewable"
      on categories for select
      using ( true );
  end if;
end $$;

-- 2. Seed initial data
insert into categories (slug, name_en, name_ar, icon) values
  ('workshop', 'Workshop', 'ورشة عمل', '🎨'),
  ('bazaar', 'Bazaar', 'بازار', '🛍️'),
  ('concert', 'Concert', 'حفل موسيقي', '🎵'),
  ('exhibition', 'Exhibition', 'معرض فني', '🖼️'),
  ('course', 'Course', 'دورة تدريبية', '📚'),
  ('meetup', 'Meetup', 'لقاء مجتمعي', '🤝'),
  ('food', 'Food & Festivals', 'طعام / مهرجان', '🍲'),
  ('other', 'Other', 'آخر', '✨')
on conflict (slug) do nothing;

-- 3. Update events table
-- Add category_id column
alter table events add column if not exists category_id uuid references categories(id) on delete set null;

-- Drop legacy check constraint
alter table events drop constraint if exists events_event_type_check;

-- Migrate existing data
update events
set category_id = categories.id
from categories
where events.event_type = categories.slug;

-- 4. Update get_events_pro to return category details
drop function if exists get_events_pro;

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
  category_id uuid, -- NEW
  category_name_en text, -- NEW
  category_name_ar text, -- NEW
  category_slug text, -- NEW
  category_icon text, -- NEW
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
    (p_min_price is null or coalesce(min((select price from tickets t where t.event_id = e.id limit 1)), 0) >= p_min_price) 
    and (p_max_price is null or coalesce(min((select price from tickets t where t.event_id = e.id limit 1)), 0) <= p_max_price)

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
`;

// SQL for Cleanup (Optional, but good to include if not run)
// I will just include the categories part mainly or merge them if needed. 
// But the user asked for categories mostly.

async function migrate() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    console.error("❌ Error: DATABASE_URL (or POSTGRES_URL/SUPABASE_DB_URL) not found in .env.local");
    console.error("Available Env Vars:", Object.keys(process.env));
    process.exit(1);
  }

  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase connections usually
  });

  try {
    await client.connect();
    console.log("✅ Connected to database");

    console.log("🔄 Applying Categories Migration...");
    await client.query(sqlCategories);
    console.log("✅ Categories Migration Applied Successfully!");

  } catch (err) {
    console.error("❌ Migration Failed:", err);
  } finally {
    await client.end();
  }
}

migrate();
