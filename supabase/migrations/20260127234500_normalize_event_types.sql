-- Normalize 'General' to 'other' to match category slug
UPDATE events
SET event_type = 'other'
WHERE event_type = 'General' OR event_type IS NULL;
