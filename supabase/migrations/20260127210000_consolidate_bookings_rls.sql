-- Drop ALL existing policies to clean up the mess
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users create bookings" ON bookings;
DROP POLICY IF EXISTS "Users view own bookings" ON bookings;
DROP POLICY IF EXISTS "Vendors can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Vendors can view bookings for their events" ON bookings;
DROP POLICY IF EXISTS "Vendors can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Vendors manage own event bookings" ON bookings;
DROP POLICY IF EXISTS "Vendors view own event bookings" ON bookings;
DROP POLICY IF EXISTS "Public can create bookings" ON bookings;

-- Re-enable RLS just in case
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 1. USERS: View own
CREATE POLICY "Users view own bookings"
ON bookings FOR SELECT
USING ( auth.uid() = user_id );

-- 2. USERS: Create (Insert)
CREATE POLICY "Users create bookings"
ON bookings FOR INSERT
WITH CHECK ( auth.uid() = user_id OR user_id IS NULL ); -- Allow guest if we support it, otherwise auth.uid() = user_id

-- 3. USERS: Update own (Cancellation, Payment Upload)
CREATE POLICY "Users update own bookings"
ON bookings FOR UPDATE
USING ( auth.uid() = user_id );

-- 4. VENDORS: View own (Key for Dashboard)
CREATE POLICY "Vendors view own bookings"
ON bookings FOR SELECT
USING ( auth.uid() = vendor_id );

-- 5. VENDORS: Update own (Confirm/Reject)
CREATE POLICY "Vendors update own bookings"
ON bookings FOR UPDATE
USING ( auth.uid() = vendor_id );
