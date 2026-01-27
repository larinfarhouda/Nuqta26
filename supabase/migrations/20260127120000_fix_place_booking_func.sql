-- Fix place_booking function visibility/schema cache
-- Re-defining the function to ensure it exists and matches the signature expected by the app.

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
    status,
    discount_amount,
    discount_code_id
  ) values (
    p_event_id,
    v_vendor_id,
    p_user_id,
    p_total_amount,
    case when p_total_amount > 0 then 'pending_payment' else 'confirmed' end,
    p_discount_amount,
    p_discount_code_id
  ) returning id into v_booking_id;

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
