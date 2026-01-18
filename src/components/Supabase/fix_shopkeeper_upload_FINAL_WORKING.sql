-- ============================================
-- FINAL WORKING FIX: Shopkeeper Upload
-- ============================================
-- The issue: RLS policies on storage.objects can't directly access auth.users
-- Solution: Use a SECURITY DEFINER function to check auth.users

-- ============================================
-- STEP 1: Ensure raw_user_meta_data is set
-- ============================================
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('user_type', 'shopkeeper')
WHERE email = 'shopkeeper@cvbuilder.com';

-- ============================================
-- STEP 2: Create a function to check if user is shopkeeper
-- ============================================
-- This function has SECURITY DEFINER so it can access auth.users
CREATE OR REPLACE FUNCTION is_shopkeeper_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'user_type')::text = 'shopkeeper'
  );
END;
$$;

-- ============================================
-- STEP 3: Drop and recreate the upload policy using the function
-- ============================================
DROP POLICY IF EXISTS "Shopkeepers can upload marketplace images" ON storage.objects;

CREATE POLICY "Shopkeepers can upload marketplace images" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'marketplace-images' 
    AND auth.uid() IS NOT NULL
    AND is_shopkeeper_user() = true
  );

-- ============================================
-- STEP 4: Verify everything
-- ============================================
-- Check metadata
SELECT 
  'Metadata' as check_type,
  email,
  raw_user_meta_data->>'user_type' as user_type,
  CASE 
    WHEN raw_user_meta_data->>'user_type' = 'shopkeeper' THEN '✅ Correct'
    ELSE '❌ Missing'
  END as status
FROM auth.users
WHERE email = 'shopkeeper@cvbuilder.com';

-- Check function exists
SELECT 
  'Function' as check_type,
  proname as function_name,
  CASE 
    WHEN proname = 'is_shopkeeper_user' THEN '✅ Function exists'
    ELSE '❌ Function missing'
  END as status
FROM pg_proc
WHERE proname = 'is_shopkeeper_user';

-- Check policy
SELECT 
  'Policy' as check_type,
  policyname,
  CASE 
    WHEN policyname = 'Shopkeepers can upload marketplace images' THEN '✅ Policy exists'
    ELSE '❌ Policy missing'
  END as status,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname = 'Shopkeepers can upload marketplace images';

-- ============================================
-- IMPORTANT: After running this script
-- ============================================
-- 1. LOG OUT from shopkeeper@cvbuilder.com
-- 2. LOG BACK IN (this refreshes the session)
-- 3. Try uploading an image again
-- ============================================
-- This should work because the function has SECURITY DEFINER
-- which allows it to access auth.users even from RLS context
-- ============================================
