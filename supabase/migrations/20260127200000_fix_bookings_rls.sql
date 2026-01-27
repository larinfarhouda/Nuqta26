-- Ensure Vendors can view bookings destined for them
DROP POLICY IF EXISTS "Vendors can view their own bookings" ON bookings;
CREATE POLICY "Vendors can view their own bookings"
ON bookings FOR SELECT
USING ( auth.uid() = vendor_id );

-- Ensure Vendors can update bookings destined for them
DROP POLICY IF EXISTS "Vendors can update their own bookings" ON bookings;
CREATE POLICY "Vendors can update their own bookings"
ON bookings FOR UPDATE
USING ( auth.uid() = vendor_id );
