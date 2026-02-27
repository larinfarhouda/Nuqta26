-- Add reminder_sent flag to bookings for event reminder notifications
ALTER TABLE bookings ADD COLUMN reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;

-- Composite index for the cron query: find confirmed bookings not yet reminded, by event
CREATE INDEX idx_bookings_reminder_lookup
  ON bookings (status, reminder_sent, event_id)
  WHERE status = 'confirmed' AND reminder_sent = FALSE;
