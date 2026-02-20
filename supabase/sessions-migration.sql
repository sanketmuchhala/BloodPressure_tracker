-- Sessions Migration for Blood Pressure Tracker
-- Creates bp_sessions table for storing averaged readings from multiple BP measurements
-- Adds session_id reference to bp_logs for linking individual readings to sessions

-- Create sessions table to store averaged readings
CREATE TABLE IF NOT EXISTS bp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_at TIMESTAMPTZ NOT NULL,
  reading_count INTEGER NOT NULL CHECK (reading_count >= 1 AND reading_count <= 10),
  avg_systolic INTEGER NOT NULL CHECK (avg_systolic >= 50 AND avg_systolic <= 250),
  avg_diastolic INTEGER NOT NULL CHECK (avg_diastolic >= 30 AND avg_diastolic <= 150),
  avg_pulse INTEGER NOT NULL CHECK (avg_pulse >= 30 AND avg_pulse <= 200),
  photo_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add session reference to bp_logs
ALTER TABLE bp_logs
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES bp_sessions(id) ON DELETE CASCADE;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_bp_sessions_user_session
  ON bp_sessions(user_id, session_at DESC);

CREATE INDEX IF NOT EXISTS idx_bp_logs_session
  ON bp_logs(session_id);

-- Row Level Security for bp_sessions
ALTER TABLE bp_sessions ENABLE ROW LEVEL SECURITY;

-- Allow single user to view their sessions
CREATE POLICY "Users can view their own sessions"
  ON bp_sessions FOR SELECT
  USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Allow single user to insert their sessions
CREATE POLICY "Users can insert their own sessions"
  ON bp_sessions FOR INSERT
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Comments for documentation
COMMENT ON TABLE bp_sessions IS 'Stores averaged blood pressure readings from multiple measurements taken in a single session';
COMMENT ON COLUMN bp_sessions.reading_count IS 'Number of individual readings averaged (1-10)';
COMMENT ON COLUMN bp_sessions.avg_systolic IS 'Average systolic pressure rounded to nearest integer';
COMMENT ON COLUMN bp_sessions.avg_diastolic IS 'Average diastolic pressure rounded to nearest integer';
COMMENT ON COLUMN bp_sessions.avg_pulse IS 'Average pulse rate rounded to nearest integer';
COMMENT ON COLUMN bp_logs.session_id IS 'Optional reference to parent session if this is part of a multi-reading session';
