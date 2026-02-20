-- Blood Pressure Tracker Storage Policies
-- Instructions for setting up Supabase Storage

-- ============================================================================
-- STEP 1: Create Storage Bucket (via Supabase Dashboard)
-- ============================================================================
-- 1. Go to Storage in your Supabase dashboard
-- 2. Click "New bucket"
-- 3. Bucket name: bp-photos
-- 4. Public bucket: NO (keep it private)
-- 5. File size limit: 5 MB (recommended)
-- 6. Allowed MIME types: image/jpeg, image/jpg, image/png
-- 7. Click "Create bucket"

-- ============================================================================
-- STEP 2: Apply Storage Policies (run this SQL)
-- ============================================================================

-- Policy: Users can upload photos to their own folder
CREATE POLICY "Users can upload own photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'bp-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can read their own photos (for signed URLs)
CREATE POLICY "Users can view own photos"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'bp-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Optional: Allow users to update their own photos (uncomment if needed)
-- CREATE POLICY "Users can update own photos"
--   ON storage.objects
--   FOR UPDATE
--   USING (
--     bucket_id = 'bp-photos' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   )
--   WITH CHECK (
--     bucket_id = 'bp-photos' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- Optional: Allow users to delete their own photos (uncomment if needed)
-- CREATE POLICY "Users can delete own photos"
--   ON storage.objects
--   FOR DELETE
--   USING (
--     bucket_id = 'bp-photos' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- ============================================================================
-- FOLDER STRUCTURE
-- ============================================================================
-- Photos are stored in per-user folders organized by year-month:
-- {userId}/YYYY-MM/{uuid}.jpg
--
-- Example:
-- 550e8400-e29b-41d4-a716-446655440000/2026-02/123e4567-e89b-12d3-a456-426614174000.jpg
--
-- This structure:
-- - Isolates each user's photos in their own folder
-- - Organizes photos by month for easier management
-- - Uses UUIDs for unique filenames (prevents collisions)
-- ============================================================================

-- Success message
SELECT 'Storage policies configured successfully!' AS status;

-- ============================================================================
-- NOTES
-- ============================================================================
-- - Photos are stored in a PRIVATE bucket (not public)
-- - Access is controlled via RLS policies
-- - App uses signed URLs (1-hour expiry) to display photos
-- - Each user can only access photos in their own folder
-- - Folder path is enforced by the policies above
-- ============================================================================
