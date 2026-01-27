-- Drop the existing constraint if it exists (to avoid errors if it doesn't match)
alter table bookings drop constraint if exists bookings_status_check;

-- Re-add the constraint with the correct allowed values
alter table bookings add constraint bookings_status_check 
check (status in ('confirmed', 'cancelled', 'pending_payment', 'payment_submitted'));
