-- Add location_details column to events and vendors tables
ALTER TABLE events ADD COLUMN IF NOT EXISTS location_details TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS location_details TEXT;
