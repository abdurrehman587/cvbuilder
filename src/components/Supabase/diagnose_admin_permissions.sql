-- Diagnostic Script for Admin Permissions
-- Run this to check if everything is set up correctly

-- 1. Check if the function exists
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  proowner::regrole as owner
FROM pg_proc 
WHERE proname = 'is_admin_user';

-- 2. Test the function (should return true if you're an admin)
SELECT public.is_admin_user() as is_admin;

-- 3. Check if admin policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'marketplace_products' 
  AND policyname LIKE '%Admin%'
ORDER BY policyname;

-- 4. Check your current user and admin status
SELECT 
  auth.uid() as current_user_id,
  email,
  is_admin
FROM public.users 
WHERE id = auth.uid();

-- 5. Check RLS status on marketplace_products
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'marketplace_products';
