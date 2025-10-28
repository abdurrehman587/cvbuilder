-- Database Connection Test Script
-- Run this after setting up the database to verify everything works

-- Test 1: Check if tables exist
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'cvs', 'templates')
ORDER BY tablename;

-- Test 2: Check RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'cvs', 'templates')
ORDER BY tablename;

-- Test 3: Check policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'cvs', 'templates')
ORDER BY tablename, policyname;

-- Test 4: Check if admin user exists
SELECT 
  id,
  email,
  full_name,
  is_admin,
  created_at
FROM public.users
WHERE is_admin = TRUE;

-- Test 5: Check CVs table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'cvs'
ORDER BY ordinal_position;

-- Test 6: Check users table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Test 7: Test basic query (this should work for any authenticated user)
-- Note: This will only work if you're logged in as a user
SELECT COUNT(*) as total_cvs FROM public.cvs;

-- Test 8: Test admin query (this should work for admin users)
-- Note: This will only work if you're logged in as an admin
SELECT 
  c.id,
  c.name,
  c.title,
  c.company,
  c.user_id,
  u.email as user_email,
  c.created_at
FROM public.cvs c
LEFT JOIN public.users u ON c.user_id = u.id
ORDER BY c.created_at DESC
LIMIT 5;

