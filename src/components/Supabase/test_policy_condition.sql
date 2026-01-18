-- ============================================
-- TEST POLICY CONDITION FOR CURRENT USER
-- ============================================
-- This simulates what the policy checks when you try to upload

-- First, get your current user ID (you'll need to replace this with your actual user ID)
-- You can find your user ID by running:
SELECT id, email, raw_user_meta_data->>'user_type' as user_type
FROM auth.users
WHERE email = 'shopkeeper@cvbuilder.com';

-- Then test the policy condition (replace USER_ID_HERE with the ID from above)
-- SELECT 
--   EXISTS (
--     SELECT 1 FROM auth.users 
--     WHERE id = 'USER_ID_HERE'::uuid
--     AND (raw_user_meta_data->>'user_type')::text = 'shopkeeper'
--   ) as policy_condition_result;

-- ============================================
-- ALTERNATIVE: Check policy definition directly
-- ============================================
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname = 'Shopkeepers can upload marketplace images';

-- The with_check column shows the exact condition the policy uses
-- It should match: bucket_id = 'marketplace-images' AND EXISTS(...)
