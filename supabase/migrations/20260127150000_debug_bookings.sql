do $$
declare
  r record;
  v_profile_exists boolean;
  v_event_exists boolean;
begin
  raise notice '--- DEBUG RELATIONS START ---';
  for r in select id, vendor_id, user_id, event_id from bookings where vendor_id = 'a0d3d367-3802-42dc-a1cf-1d14f42496f5' loop
    select exists(select 1 from profiles where id = r.user_id) into v_profile_exists;
    select exists(select 1 from events where id = r.event_id) into v_event_exists;
    
    raise notice 'Booking: %, User Profile Exists: %, Event Exists: %', r.id, v_profile_exists, v_event_exists;
  end loop;
  raise notice '--- DEBUG RELATIONS END ---';
end $$;
