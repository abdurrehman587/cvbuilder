-- Verify Admin Status in Auth Metadata
-- Run this to check if your admin status is properly synced

-- 1. Check all users with admin status in auth metadata
SELECT 
  id,
  email,
  raw_user_meta_data->>'is_admin' as is_admin_metadata,
  raw_user_meta_data->>'user_type' as user_type_metadata,
  created_at
FROM auth.users
WHERE raw_user_meta_data->>'is_admin' = 'true'
ORDER BY created_at DESC;

-- 2. Check if is_admin_user() function works
-- Replace with your actual user ID or email
-- SELECT public.is_admin_user() as is_admin;

-- 3. Compare with public.users table
SELECT 
  u.id,
  u.email,
  u.is_admin as is_admin_in_db,
  au.raw_user_meta_data->>'is_admin' as is_admin_in_metadata
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.is_admin = true
ORDER BY u.created_at DESC;

-- 4. If your admin status is not in auth metadata, set it manually:
-- Replace 'your-email@example.com' with your actual email
-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{is_admin}',
--   'true'::jsonb
-- )
-- WHERE email = 'your-email@example.com';
