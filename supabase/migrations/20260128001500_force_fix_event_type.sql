-- Force update for the specific problematic event and any other UUID-like strings
UPDATE events
SET event_type = 'other'
WHERE event_type = '002232c4-4426-404b-8955-6d7dade2b50c' -- The exact culprit
   OR event_type ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' -- Any other ID
   OR length(event_type) = 36; -- Brute force check
