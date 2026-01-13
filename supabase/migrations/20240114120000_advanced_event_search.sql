-- Function to search events with distance calculation (Haversine formula)
-- and multiple filters (Category, Price, Search)

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
    e.price,
    e.date,
    e.status,
    e.event_type,
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
  where
    e.status = 'published'
    and (p_category is null or e.event_type = p_category)
    and (p_min_price is null or e.price >= p_min_price)
    and (p_max_price is null or e.price <= p_max_price)
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
  order by
    case when p_lat is not null then dist_km end asc,
    e.date asc
  limit p_limit offset p_offset;
end;
$$;
