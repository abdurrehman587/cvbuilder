-- ============================================
-- FIX SHOPKEEPER UPLOAD POLICY
-- ============================================
-- If the policy exists but uploads still fail, try recreating it with this version

-- Step 1: Drop and recreate the upload policy
DROP POLICY IF EXISTS "Shopkeepers can upload marketplace images" ON storage.objects;

-- Step 2: Create the upload policy with explicit check
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

-- Step 3: Verify the policy was created
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname = 'Shopkeepers can upload marketplace images';

-- ============================================
-- TROUBLESHOOTING: Check if auth.uid() works
-- ============================================
-- Run this to see what auth.uid() returns (should return NULL in SQL editor, but works in RLS context)
-- SELECT auth.uid() as current_user_id;

-- ============================================
-- ALTERNATIVE: If above doesn't work, try this simpler version
-- ============================================
-- DROP POLICY IF EXISTS "Shopkeepers can upload marketplace images" ON storage.objects;
-- 
-- CREATE POLICY "Shopkeepers can upload marketplace images" ON storage.objects
--   FOR INSERT 
--   WITH CHECK (
--     bucket_id = 'marketplace-images'
--   );
-- 
-- NOTE: This simpler version allows ANY authenticated user to upload to marketplace-images
-- Only use this if the shopkeeper-specific check isn't working
