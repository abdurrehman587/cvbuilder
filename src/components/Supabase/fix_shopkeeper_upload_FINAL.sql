-- ============================================
-- COMPLETE FIX: Shopkeeper Upload Issue
-- ============================================
-- This script fixes the "new row violates row-level security policy" error
-- by ensuring both the metadata is set AND the policy is correct

-- ============================================
-- STEP 1: Fix the user's raw_user_meta_data
-- ============================================
-- The RLS policy checks raw_user_meta_data in the database
-- This MUST be set for the policy to work
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('user_type', 'shopkeeper')
WHERE email = 'shopkeeper@cvbuilder.com';

-- ============================================
-- STEP 2: Recreate the upload policy
-- ============================================
-- Drop and recreate to ensure it's correct
DROP POLICY IF EXISTS "Shopkeepers can upload marketplace images" ON storage.objects;

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
-- STEP 3: Verify everything is correct
-- ============================================
-- Check 1: Verify raw_user_meta_data is set
SELECT 
  email,
  raw_user_meta_data,
  raw_user_meta_data->>'user_type' as user_type_from_raw,
  CASE 
    WHEN raw_user_meta_data->>'user_type' = 'shopkeeper' THEN '✅ Correct'
    ELSE '❌ Missing or incorrect'
  END as metadata_status
FROM auth.users
WHERE email = 'shopkeeper@cvbuilder.com';

-- Check 2: Verify policy exists
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN with_check LIKE '%raw_user_meta_data%' THEN '✅ Policy checks raw_user_meta_data'
    ELSE '⚠️ Policy might not check raw_user_meta_data'
  END as policy_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname = 'Shopkeepers can upload marketplace images';

-- ============================================
-- IMPORTANT: After running this script
-- ============================================
-- 1. LOG OUT from the shopkeeper account
-- 2. LOG BACK IN (this refreshes the session)
-- 3. Try uploading an image again
-- ============================================
