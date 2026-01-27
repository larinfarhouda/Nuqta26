-- Allow users to update their own bookings (e.g. for payment proof upload)
create policy "Users can update own bookings" on bookings
for update using (auth.uid() = user_id);
