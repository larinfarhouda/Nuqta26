-- Function to increment discount code usage atomically
create or replace function increment_discount_usage(p_discount_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_discount record;
begin
  -- Lock the row for update to prevent concurrent changes
  select * into v_discount
  from discount_codes
  where id = p_discount_id
  for update;

  if not found then
    return json_build_object('success', false, 'error', 'Discount code not found');
  end if;

  if not v_discount.is_active then
    return json_build_object('success', false, 'error', 'Discount code is inactive');
  end if;

  if v_discount.expiry_date is not null and v_discount.expiry_date < now() then
    return json_build_object('success', false, 'error', 'Discount code has expired');
  end if;

  if v_discount.max_uses is not null and v_discount.used_count >= v_discount.max_uses then
    return json_build_object('success', false, 'error', 'Discount code has reached its maximum uses');
  end if;

  -- Increment usage
  update discount_codes
  set used_count = used_count + 1
  where id = p_discount_id;

  return json_build_object('success', true, 'new_used_count', v_discount.used_count + 1);
end;
$$;
