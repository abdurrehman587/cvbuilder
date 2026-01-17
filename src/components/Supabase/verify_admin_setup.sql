-- Verification Script: Check if admin setup is working
-- Run this to verify the admin fix is working correctly

-- 1. Check if is_admin_user() function exists and works
SELECT 
  'Function exists' as check_type,
  public.is_admin_user() as is_current_user_admin;

-- 2. Check if admin status is in auth metadata
SELECT 
  'Auth metadata check' as check_type,
  id,
  email,
  raw_user_meta_data->>'is_admin' as is_admin_metadata,
  raw_user_meta_data->>'user_type' as user_type_metadata
FROM auth.users
WHERE raw_user_meta_data->>'is_admin' = 'true'
LIMIT 5;

-- 3. Check if trigger exists
SELECT 
  'Trigger check' as check_type,
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'sync_admin_to_auth_trigger';

-- 4. Check if RPC function exists
SELECT 
  'RPC function check' as check_type,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'admin_update_product'
  AND routine_schema = 'public';

-- 5. Check marketplace_products admin policies
SELECT 
  'Policy check' as check_type,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'marketplace_products'
  AND policyname LIKE '%Admin%'
ORDER BY policyname;
