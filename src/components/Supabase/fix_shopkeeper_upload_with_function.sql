-- ============================================
-- ALTERNATIVE FIX: Using Database Function
-- ============================================
-- This approach uses a function to check user type, which is more reliable
-- for RLS policies

-- ============================================
-- STEP 1: Ensure raw_user_meta_data is set
-- ============================================
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('user_type', 'shopkeeper')
WHERE email = 'shopkeeper@cvbuilder.com';

-- ============================================
-- STEP 2: Create a helper function to check if user is shopkeeper
-- ============================================
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
  email,
  raw_user_meta_data->>'user_type' as user_type_from_raw,
  CASE 
    WHEN raw_user_meta_data->>'user_type' = 'shopkeeper' THEN '✅ Correct'
    ELSE '❌ Missing'
  END as status
FROM auth.users
WHERE email = 'shopkeeper@cvbuilder.com';

-- Check function exists
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname = 'is_shopkeeper_user';

-- Check policy
SELECT 
  policyname,
  cmd,
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
