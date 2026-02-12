-- =============================================================================
-- Migration: Super Admin Panel — New Tables & Columns
-- Run in Supabase Dashboard → SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. PROSPECT VENDORS (must be created BEFORE events columns that reference it)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prospect_vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  logo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  instagram TEXT,
  website TEXT,
  notes TEXT,
  status TEXT DEFAULT 'prospect'
    CHECK (status IN ('prospect', 'contacted', 'converted', 'rejected')),
  converted_vendor_id UUID REFERENCES vendors(id),
  claim_token TEXT UNIQUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE prospect_vendors ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_prospect_vendors_status ON prospect_vendors(status);
CREATE INDEX IF NOT EXISTS idx_prospect_vendors_claim_token ON prospect_vendors(claim_token);

-- Admin-only policies (handled via service role key server-side)
-- Public read for claim page
CREATE POLICY "Prospect vendors viewable by everyone"
  ON prospect_vendors FOR SELECT USING (true);

-- -----------------------------------------------------------------------------
-- 2. EVENT INTERESTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_interests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE event_interests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_event_interests_event_id ON event_interests(event_id);
CREATE INDEX IF NOT EXISTS idx_event_interests_user_id ON event_interests(user_id);

-- Users can view and manage their own interests
CREATE POLICY "Users can view own interests"
  ON event_interests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interests"
  ON event_interests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own interests"
  ON event_interests FOR DELETE USING (auth.uid() = user_id);
-- Vendors can view interests for their events
CREATE POLICY "Vendors can view interests for their events"
  ON event_interests FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_interests.event_id
        AND events.vendor_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 3. ACTIVITY LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Admin-only via service role key (no public RLS)

-- -----------------------------------------------------------------------------
-- 4. NEW COLUMNS ON EVENTS
-- -----------------------------------------------------------------------------
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS featured_at TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS prospect_vendor_id UUID REFERENCES prospect_vendors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_is_featured ON events(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_events_prospect_vendor_id ON events(prospect_vendor_id);

-- -----------------------------------------------------------------------------
-- 5. SYSTEM VENDOR ACCOUNT (for prospect events)
-- -----------------------------------------------------------------------------
-- We need a "Nuqta Platform" vendor to own prospect events
-- This must be done via auth.users first (admin creates this account once)
-- The vendor_id for prospect events will be set to this account's ID
-- 
-- NOTE: If you haven't created a system account yet, create one via:
--   1. Supabase Dashboard → Authentication → Users → Add User
--   2. Email: system@nuqta.events, role: vendor
--   3. Note the user ID and update the vendor entry below
--
-- After creating the auth user, ensure vendor entry exists:
-- INSERT INTO vendors (id, business_name, category, slug)
-- VALUES ('<SYSTEM_USER_ID>', 'Nuqta Platform', 'other', 'nuqta-platform')
-- ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6. COMMENTS
-- -----------------------------------------------------------------------------
COMMENT ON TABLE prospect_vendors IS 'Vendors scouted by admin who have not yet signed up. Used for Phantom Listings.';
COMMENT ON TABLE event_interests IS 'Tracks user interest in prospect/unclaimed events. Requires login.';
COMMENT ON TABLE activity_logs IS 'Platform-wide activity log for admin dashboard.';
COMMENT ON COLUMN events.is_featured IS 'Admin-curated featured flag for homepage prominence.';
COMMENT ON COLUMN events.prospect_vendor_id IS 'Links to prospect_vendors for admin-listed events. NULL for normal vendor events.';
