-- Fix Foreign Key Constraint on bp_logs
-- The original migration references auth.users(id), but this app uses
-- PIN-based auth with a fixed UUID that doesn't exist in auth.users.
-- This drops that constraint so inserts work without Supabase Auth.

-- Step 1: Find and drop the foreign key constraint
-- (The constraint name may vary — this handles the most common name)
ALTER TABLE bp_logs
  DROP CONSTRAINT IF EXISTS bp_logs_user_id_fkey;

-- Step 2: Confirm the constraint is gone and table still has user_id
-- (user_id remains as a plain UUID column, no FK reference)
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'bp_logs' AND column_name = 'user_id';

-- Step 3: Verify no FK constraints remain on bp_logs
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'bp_logs'
  AND tc.constraint_type = 'FOREIGN KEY';

SELECT 'Foreign key constraint removed. Inserts should now work!' AS status;
