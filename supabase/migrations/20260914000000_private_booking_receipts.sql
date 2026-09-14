-- Apply before enabling receipt uploads in production. Existing URLs become private.
begin;
update storage.buckets set public = false, file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
where id = 'booking-receipts';

create or replace function public.can_access_booking_receipt(object_name text, write_access boolean default false)
returns boolean language sql stable security definer set search_path = public
as $$
    select auth.uid() is not null and exists (
        select 1 from public.bookings b
        where b.id::text = substring(object_name from '^receipts/([0-9a-f-]{36})(/|-)')
        and case when write_access then
            b.user_id = auth.uid() and b.status in ('pending_payment', 'payment_submitted')
        else b.user_id = auth.uid() or b.vendor_id = auth.uid()
            or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
        end
    );
$$;
revoke all on function public.can_access_booking_receipt(text, boolean) from public;
grant execute on function public.can_access_booking_receipt(text, boolean) to authenticated, anon;

-- Restrictive policies also constrain any older broad storage policies.
drop policy if exists "receipt_select_boundary" on storage.objects;
create policy "receipt_select_boundary" on storage.objects as restrictive for select to public using (bucket_id <> 'booking-receipts' or public.can_access_booking_receipt(name, false)) ;
drop policy if exists "receipt_select_authorized" on storage.objects;
create policy "receipt_select_authorized" on storage.objects for select to authenticated using (bucket_id = 'booking-receipts' and public.can_access_booking_receipt(name, false)) ;
drop policy if exists "receipt_insert_boundary" on storage.objects;
create policy "receipt_insert_boundary" on storage.objects as restrictive for insert to public with check (bucket_id <> 'booking-receipts' or public.can_access_booking_receipt(name, true));
drop policy if exists "receipt_insert_authorized" on storage.objects;
create policy "receipt_insert_authorized" on storage.objects for insert to authenticated with check (bucket_id = 'booking-receipts' and public.can_access_booking_receipt(name, true));
drop policy if exists "receipt_update_boundary" on storage.objects;
create policy "receipt_update_boundary" on storage.objects as restrictive for update to public using (bucket_id <> 'booking-receipts' or public.can_access_booking_receipt(name, true)) with check (bucket_id <> 'booking-receipts' or public.can_access_booking_receipt(name, true));
drop policy if exists "receipt_update_authorized" on storage.objects;
create policy "receipt_update_authorized" on storage.objects for update to authenticated using (bucket_id = 'booking-receipts' and public.can_access_booking_receipt(name, true)) with check (bucket_id = 'booking-receipts' and public.can_access_booking_receipt(name, true));
drop policy if exists "receipt_delete_boundary" on storage.objects;
create policy "receipt_delete_boundary" on storage.objects as restrictive for delete to public using (bucket_id <> 'booking-receipts' or public.can_access_booking_receipt(name, true)) ;
drop policy if exists "receipt_delete_authorized" on storage.objects;
create policy "receipt_delete_authorized" on storage.objects for delete to authenticated using (bucket_id = 'booking-receipts' and public.can_access_booking_receipt(name, true)) ;
commit;
