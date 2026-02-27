-- Add review_request_sent flag to bookings for post-event review request emails
ALTER TABLE bookings ADD COLUMN review_request_sent BOOLEAN NOT NULL DEFAULT FALSE;

-- Composite index for the cron query: find confirmed bookings not yet sent a review request
CREATE INDEX idx_bookings_review_request_lookup
  ON bookings (status, review_request_sent, event_id)
  WHERE status = 'confirmed' AND review_request_sent = FALSE;
