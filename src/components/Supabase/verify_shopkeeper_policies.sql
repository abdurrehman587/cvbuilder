-- ============================================
-- VERIFY SHOPKEEPER STORAGE POLICIES
-- ============================================
-- Run these queries to check if policies exist and troubleshoot

-- Method 1: Check all policies on storage.objects
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;

-- Method 2: Check specifically for shopkeeper policies
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'INSERT' THEN 'Upload permission'
    WHEN cmd = 'SELECT' THEN 'View permission'
    WHEN cmd = 'UPDATE' THEN 'Update permission'
    WHEN cmd = 'DELETE' THEN 'Delete permission'
    ELSE cmd
  END as permission_type
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%shopkeeper%'
ORDER BY cmd;

-- Method 3: Check if policies exist (case-insensitive search)
SELECT 
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND (LOWER(policyname) LIKE '%shopkeeper%' OR LOWER(policyname) LIKE '%marketplace%')
ORDER BY policyname;

-- Method 4: Direct query to information_schema (alternative method)
SELECT 
  policy_name,
  policy_command
FROM information_schema.row_security_policies
WHERE table_schema = 'storage'
  AND table_name = 'objects'
  AND policy_name LIKE '%shopkeeper%';
