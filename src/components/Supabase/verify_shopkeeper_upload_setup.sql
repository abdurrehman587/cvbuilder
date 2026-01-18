-- ============================================
-- FINAL VERIFICATION: Shopkeeper Upload Setup
-- ============================================
-- Run this to verify everything is ready

-- Check 1: Function exists and is correct
SELECT 
  'Function Check' as check_name,
  proname as function_name,
  prosrc as function_body,
  CASE 
    WHEN proname = 'is_shopkeeper_user' THEN '✅ Function exists'
    ELSE '❌ Function missing'
  END as status
FROM pg_proc
WHERE proname = 'is_shopkeeper_user';

-- Check 2: Metadata is set
SELECT 
  'Metadata Check' as check_name,
  email,
  raw_user_meta_data->>'user_type' as user_type,
  CASE 
    WHEN raw_user_meta_data->>'user_type' = 'shopkeeper' THEN '✅ Correct'
    ELSE '❌ Missing'
  END as status
FROM auth.users
WHERE email = 'shopkeeper@cvbuilder.com';

-- Check 3: Policy uses the function
SELECT 
  'Policy Check' as check_name,
  policyname,
  CASE 
    WHEN with_check LIKE '%is_shopkeeper_user()%' THEN '✅ Policy uses function'
    ELSE '❌ Policy does not use function'
  END as status,
  with_check as policy_condition
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname = 'Shopkeepers can upload marketplace images';

-- Check 4: Test the function (simulate what happens during upload)
-- This will show NULL in SQL editor (auth.uid() is NULL there), but will work in RLS context
DO $$
DECLARE
  test_user_id UUID;
  function_result BOOLEAN;
BEGIN
  -- Get the shopkeeper user ID
  SELECT id INTO test_user_id
  FROM auth.users
  WHERE email = 'shopkeeper@cvbuilder.com';
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE '❌ User not found!';
  ELSE
    -- Test the function logic manually (simulating auth.uid() = test_user_id)
    SELECT EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE id = test_user_id
        AND (raw_user_meta_data->>'user_type')::text = 'shopkeeper'
    ) INTO function_result;
    
    IF function_result THEN
      RAISE NOTICE '✅ Function logic would return TRUE for user: %', test_user_id;
      RAISE NOTICE '   The upload should work after you log out and log back in!';
    ELSE
      RAISE NOTICE '❌ Function logic would return FALSE for user: %', test_user_id;
      RAISE NOTICE '   Check that raw_user_meta_data->>''user_type'' = ''shopkeeper''';
    END IF;
  END IF;
END $$;

-- ============================================
-- SUMMARY
-- ============================================
-- If all checks show ✅, then:
-- 1. LOG OUT from shopkeeper@cvbuilder.com
-- 2. LOG BACK IN (this refreshes your session)
-- 3. Try uploading an image
-- ============================================
