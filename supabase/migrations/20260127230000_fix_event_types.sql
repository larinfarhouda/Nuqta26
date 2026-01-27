-- Reset event types that look like UUIDs to 'General'
UPDATE events
SET event_type = 'General'
WHERE event_type ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
