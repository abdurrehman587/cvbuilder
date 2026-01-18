-- ============================================
-- SIMPLE FIX: Shopkeeper Upload (Step-by-Step)
-- ============================================
-- Run each section separately and check the results

-- ============================================
-- STEP 1: Fix the database metadata
-- ============================================
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('user_type', 'shopkeeper')
WHERE email = 'shopkeeper@cvbuilder.com';

-- Verify it worked:
SELECT 
  email,
  raw_user_meta_data->>'user_type' as user_type,
  CASE 
    WHEN raw_user_meta_data->>'user_type' = 'shopkeeper' THEN '✅ SUCCESS - Continue to Step 2'
    ELSE '❌ FAILED - Check the UPDATE statement above'
  END as result
FROM auth.users
WHERE email = 'shopkeeper@cvbuilder.com';

-- ============================================
-- STEP 2: Recreate the upload policy
-- ============================================
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

-- Verify it was created:
SELECT 
  policyname,
  CASE 
    WHEN policyname IS NOT NULL THEN '✅ Policy created successfully'
    ELSE '❌ Policy creation failed'
  END as result
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname = 'Shopkeepers can upload marketplace images';

-- ============================================
-- STEP 3: Final verification
-- ============================================
-- This should show both checks as ✅
SELECT 
  'Metadata Check' as check_type,
  CASE 
    WHEN raw_user_meta_data->>'user_type' = 'shopkeeper' THEN '✅ Correct'
    ELSE '❌ Missing'
  END as status
FROM auth.users
WHERE email = 'shopkeeper@cvbuilder.com'

UNION ALL

SELECT 
  'Policy Check' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Policy exists'
    ELSE '❌ Policy missing'
  END as status
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname = 'Shopkeepers can upload marketplace images';

-- ============================================
-- IMPORTANT NEXT STEPS:
-- ============================================
-- 1. If both checks show ✅, proceed to Step 4
-- 2. If any check shows ❌, fix that issue first
-- 3. LOG OUT from shopkeeper@cvbuilder.com
-- 4. LOG BACK IN (this refreshes your session)
-- 5. Try uploading an image again
-- ============================================
