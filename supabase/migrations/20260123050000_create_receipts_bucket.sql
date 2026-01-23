-- Create storage bucket for booking receipts
insert into storage.buckets (id, name, public)
values ('booking-receipts', 'booking-receipts', true)
on conflict (id) do nothing;

-- Set up RLS for the bucket
-- Allow public to read receipts (since we use publicUrl)
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'booking-receipts' );

-- Allow authenticated users to upload receipts
create policy "Authenticated Upload"
on storage.objects for insert
with check (
  bucket_id = 'booking-receipts'
  and auth.role() = 'authenticated'
);
