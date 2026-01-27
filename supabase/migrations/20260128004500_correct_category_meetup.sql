-- Correct "Nadi Alkitab" to be 'meetup'
UPDATE events
SET event_type = 'meetup'
WHERE title LIKE '%نادي الكتاب%';
