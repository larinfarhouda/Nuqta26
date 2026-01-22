-- Add slug column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Drop existing function to allow return type change
DROP FUNCTION IF EXISTS get_events_pro;

-- Function update: get_events_pro
-- You must run this to update the function signature and return type
CREATE OR REPLACE FUNCTION get_events_pro(
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
  slug text -- Added slug
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
    e.slug -- Added slug
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
