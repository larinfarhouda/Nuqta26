-- Add location_name column to vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS location_name TEXT;
