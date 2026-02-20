-- Fix RLS Policies for Single-User PIN-based App
-- The app does NOT use Supabase Auth (no auth.uid()).
-- It uses a fixed user UUID for all data.
-- Run this in the Supabase SQL Editor.

-- ============================================================================
-- FIX bp_logs TABLE POLICIES
-- ============================================================================

-- Drop old auth.uid()-based policies that block inserts
DROP POLICY IF EXISTS "Users can view own logs" ON bp_logs;
DROP POLICY IF EXISTS "Users can create own logs" ON bp_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON bp_logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON bp_logs;

-- Replace with fixed-UUID policies (matches SINGLE_USER_ID in supabase.js)
CREATE POLICY "Single user can view own logs"
  ON bp_logs FOR SELECT
  USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "Single user can insert own logs"
  ON bp_logs FOR INSERT
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "Single user can update own logs"
  ON bp_logs FOR UPDATE
  USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid)
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

CREATE POLICY "Single user can delete own logs"
  ON bp_logs FOR DELETE
  USING (user_id = '00000000-0000-0000-0000-000000000001'::uuid);


-- ============================================================================
-- FIX STORAGE POLICIES
-- ============================================================================

-- Drop old auth.uid()-based storage policies
DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;

-- Replace with fixed-UUID policies
CREATE POLICY "Single user can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'bp-photos' AND
    (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000001'
  );

CREATE POLICY "Single user can view photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'bp-photos' AND
    (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000001'
  );

CREATE POLICY "Single user can delete photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'bp-photos' AND
    (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000001'
  );

-- Verify
SELECT 'RLS policies fixed successfully!' AS status;
