-- Blood Pressure Tracker Database Migration
-- Run this in Supabase SQL Editor to set up the database

-- Create bp_logs table with user authentication
CREATE TABLE IF NOT EXISTS bp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reading_at TIMESTAMPTZ NOT NULL,
  systolic INTEGER NOT NULL CHECK (systolic >= 50 AND systolic <= 250),
  diastolic INTEGER NOT NULL CHECK (diastolic >= 30 AND diastolic <= 150),
  pulse INTEGER NOT NULL CHECK (pulse >= 30 AND pulse <= 200),
  photo_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
-- Index for user-specific queries ordered by reading time
CREATE INDEX IF NOT EXISTS idx_bp_logs_user_reading
  ON bp_logs(user_id, reading_at DESC);

-- Index for created_at (useful for general queries)
CREATE INDEX IF NOT EXISTS idx_bp_logs_created
  ON bp_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE bp_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data

-- Policy: Users can read their own logs
CREATE POLICY "Users can view own logs"
  ON bp_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own logs
CREATE POLICY "Users can create own logs"
  ON bp_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Optional: Allow users to update their own logs (uncomment if needed)
-- CREATE POLICY "Users can update own logs"
--   ON bp_logs
--   FOR UPDATE
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);

-- Optional: Allow users to delete their own logs (uncomment if needed)
-- CREATE POLICY "Users can delete own logs"
--   ON bp_logs
--   FOR DELETE
--   USING (auth.uid() = user_id);

-- Success message
SELECT 'Database migration completed successfully!' AS status;
