-- ============================================
-- DIAGNOSTIC: Find Why Upload Fails
-- ============================================
-- Run this to see exactly what's wrong

-- Check 1: Is raw_user_meta_data set?
SELECT 
  'Check 1: User Metadata' as check_name,
  email,
  raw_user_meta_data,
  raw_user_meta_data->>'user_type' as user_type_from_raw,
  CASE 
    WHEN raw_user_meta_data IS NULL THEN '❌ raw_user_meta_data is NULL'
    WHEN raw_user_meta_data->>'user_type' IS NULL THEN '❌ user_type is NULL in raw_user_meta_data'
    WHEN raw_user_meta_data->>'user_type' = 'shopkeeper' THEN '✅ Correct'
    ELSE '❌ user_type is: ' || COALESCE(raw_user_meta_data->>'user_type', 'NULL')
  END as status
FROM auth.users
WHERE email = 'shopkeeper@cvbuilder.com';

-- Check 2: Does the policy exist?
SELECT 
  'Check 2: Policy Exists' as check_name,
  policyname,
  cmd,
  CASE 
    WHEN policyname IS NULL THEN '❌ Policy does not exist'
    ELSE '✅ Policy exists: ' || policyname
  END as status
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname = 'Shopkeepers can upload marketplace images';

-- Check 3: What does the policy check?
SELECT 
  'Check 3: Policy Definition' as check_name,
  policyname,
  with_check as policy_condition,
  CASE 
    WHEN with_check LIKE '%raw_user_meta_data%' THEN '✅ Policy checks raw_user_meta_data'
    WHEN with_check LIKE '%shopkeeper%' THEN '⚠️ Policy mentions shopkeeper but might not check raw_user_meta_data'
    ELSE '❌ Policy does not check raw_user_meta_data'
  END as status
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname = 'Shopkeepers can upload marketplace images';

-- Check 4: Test the policy condition manually
-- This simulates what the policy checks
DO $$
DECLARE
  test_user_id UUID;
  test_result BOOLEAN;
BEGIN
  SELECT id INTO test_user_id
  FROM auth.users
  WHERE email = 'shopkeeper@cvbuilder.com';
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'Check 4: ❌ User not found!';
  ELSE
    -- Test the exact condition from the policy
    SELECT EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE id = test_user_id
        AND (raw_user_meta_data->>'user_type')::text = 'shopkeeper'
    ) INTO test_result;
    
    IF test_result THEN
      RAISE NOTICE 'Check 4: ✅ Policy condition would PASS';
      RAISE NOTICE '   User ID: %', test_user_id;
      RAISE NOTICE '   The upload should work after logging out/in';
    ELSE
      RAISE NOTICE 'Check 4: ❌ Policy condition would FAIL';
      RAISE NOTICE '   User ID: %', test_user_id;
      RAISE NOTICE '   raw_user_meta_data->>''user_type'' is not ''shopkeeper''';
      RAISE NOTICE '   Run the UPDATE statement to fix this!';
    END IF;
  END IF;
END $$;

-- Check 5: Are there any conflicting policies?
SELECT 
  'Check 5: All INSERT Policies' as check_name,
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND cmd = 'INSERT'
ORDER BY policyname;
