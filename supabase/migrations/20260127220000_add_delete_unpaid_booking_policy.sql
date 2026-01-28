-- Add policy for users to delete their own unpaid bookings
-- Users can only delete bookings with status 'pending_payment' or 'payment_submitted'

create policy "Users can delete own unpaid bookings" on bookings 
for delete 
using (
  auth.uid() = user_id 
  and status in ('pending_payment', 'payment_submitted')
);
