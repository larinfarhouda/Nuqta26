-- User Activity Tracking
-- Tracks all user and vendor actions for engagement monitoring

CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_role TEXT NOT NULL DEFAULT 'customer',
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for querying by user (recent activity first)
CREATE INDEX IF NOT EXISTS idx_ual_user_created ON user_activity_logs(user_id, created_at DESC);

-- Index for querying by action type
CREATE INDEX IF NOT EXISTS idx_ual_action_created ON user_activity_logs(action, created_at DESC);

-- Index for date-range queries (DAU/WAU/MAU)
CREATE INDEX IF NOT EXISTS idx_ual_created ON user_activity_logs(created_at DESC);

-- RLS: No RLS needed — only accessed via service role (admin client)
