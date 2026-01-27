-- Fix handle_user_update to be more robust and prevent login blocks
create or replace function public.handle_user_update()
returns trigger as $$
begin
  -- Attempt to update the profile
  update public.profiles
  set email = new.email,
      full_name = coalesce(new.raw_user_meta_data->>'full_name', full_name),
      avatar_url = coalesce(new.raw_user_meta_data->>'avatar_url', avatar_url),
      updated_at = now()
  where id = new.id;
  
  -- If no row was updated (profile missing), insert it
  if not found then
    insert into public.profiles (id, full_name, email, avatar_url)
    values (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'avatar_url');
  end if;

  return new;
exception when others then
  -- If anything fails, log it (if possible) but DO NOT BLOCK the auth update
  raise warning 'Profile update failed for user %: %', new.id, SQLERRM;
  return new;
end;
$$ language plpgsql security definer;
