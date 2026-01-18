-- ============================================
-- COMPLETE FIX: Shopkeeper Upload RLS Error
-- ============================================
-- This script fixes the "new row violates row-level security policy" error
-- Run ALL steps in order

-- ============================================
-- STEP 1: Verify current state
-- ============================================
SELECT 
  id,
  email,
  raw_user_meta_data,
  raw_user_meta_data->>'user_type' as user_type_from_raw,
  user_metadata,
  user_metadata->>'user_type' as user_type_from_metadata
FROM auth.users
WHERE email = 'shopkeeper@cvbuilder.com';

-- ============================================
-- STEP 2: Update raw_user_meta_data (CRITICAL!)
-- ============================================
-- The RLS policy checks this field in the database
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('user_type', 'shopkeeper')
WHERE email = 'shopkeeper@cvbuilder.com';

-- Also ensure user_metadata is set
UPDATE auth.users
SET user_metadata = COALESCE(user_metadata, '{}'::jsonb) || 
    jsonb_build_object('user_type', 'shopkeeper')
WHERE email = 'shopkeeper@cvbuilder.com';

-- ============================================
-- STEP 3: Verify the update worked
-- ============================================
SELECT 
  email,
  raw_user_meta_data->>'user_type' as user_type_from_raw,
  user_metadata->>'user_type' as user_type_from_metadata,
  CASE 
    WHEN raw_user_meta_data->>'user_type' = 'shopkeeper' THEN '✅ raw_user_meta_data is correct'
    ELSE '❌ raw_user_meta_data is missing or incorrect'
  END as raw_status,
  CASE 
    WHEN user_metadata->>'user_type' = 'shopkeeper' THEN '✅ user_metadata is correct'
    ELSE '❌ user_metadata is missing or incorrect'
  END as metadata_status
FROM auth.users
WHERE email = 'shopkeeper@cvbuilder.com';

-- ============================================
-- STEP 4: Drop and recreate the upload policy
-- ============================================
DROP POLICY IF EXISTS "Shopkeepers can upload marketplace images" ON storage.objects;

-- Create policy with explicit checks
CREATE POLICY "Shopkeepers can upload marketplace images" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'marketplace-images' 
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE id = auth.uid() 
        AND (raw_user_meta_data->>'user_type')::text = 'shopkeeper'
    )
  );

-- ============================================
-- STEP 5: Test the policy condition
-- ============================================
-- This simulates what happens when you try to upload
-- Replace USER_ID_HERE with the ID from STEP 1
DO $$
DECLARE
  test_user_id UUID;
  policy_result BOOLEAN;
BEGIN
  -- Get the shopkeeper user ID
  SELECT id INTO test_user_id
  FROM auth.users
  WHERE email = 'shopkeeper@cvbuilder.com';
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE '❌ User not found!';
  ELSE
    -- Test the policy condition
    SELECT EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE id = test_user_id
        AND (raw_user_meta_data->>'user_type')::text = 'shopkeeper'
    ) INTO policy_result;
    
    IF policy_result THEN
      RAISE NOTICE '✅ Policy condition would PASS for user: %', test_user_id;
      RAISE NOTICE '   The upload should work after you log out and log back in.';
    ELSE
      RAISE NOTICE '❌ Policy condition would FAIL for user: %', test_user_id;
      RAISE NOTICE '   Check that raw_user_meta_data->>''user_type'' = ''shopkeeper''';
    END IF;
  END IF;
END $$;

-- ============================================
-- STEP 6: Verify policy was created
-- ============================================
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN with_check LIKE '%raw_user_meta_data%' THEN '✅ Policy checks raw_user_meta_data'
    ELSE '⚠️ Policy might not check raw_user_meta_data correctly'
  END as policy_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname = 'Shopkeepers can upload marketplace images';

-- ============================================
-- IMPORTANT: After running this script
-- ============================================
-- 1. LOG OUT from shopkeeper@cvbuilder.com
-- 2. LOG BACK IN (this refreshes the session with updated metadata)
-- 3. Try uploading an image again
-- ============================================
-- If it still doesn't work, check the STEP 5 output
-- It should say "✅ Policy condition would PASS"
-- ============================================
