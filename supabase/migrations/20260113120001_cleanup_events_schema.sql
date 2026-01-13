-- Drop redundant columns
ALTER TABLE events DROP COLUMN IF EXISTS price;
ALTER TABLE events DROP COLUMN IF EXISTS location;
