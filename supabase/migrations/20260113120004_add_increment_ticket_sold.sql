-- Function to increment ticket sold count safely
-- Use SECURITY DEFINER to allow public users to call this during booking
create or replace function increment_ticket_sold(ticket_id uuid, quantity int)
returns void
language plpgsql
security definer
as $$
begin
  update tickets
  set sold = coalesce(sold, 0) + quantity
  where id = ticket_id;
end;
$$;
