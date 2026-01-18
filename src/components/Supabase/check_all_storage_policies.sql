-- ============================================
-- CHECK ALL STORAGE POLICIES
-- ============================================
-- This will show ALL policies on storage.objects to help troubleshoot

-- Show all policies on storage.objects
SELECT 
  policyname,
  cmd as command,
  CASE 
    WHEN cmd = 'INSERT' THEN '✅ Upload/Insert'
    WHEN cmd = 'SELECT' THEN '✅ View/Read'
    WHEN cmd = 'UPDATE' THEN '✅ Update'
    WHEN cmd = 'DELETE' THEN '✅ Delete'
    ELSE cmd
  END as permission_type,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY cmd, policyname;

-- If you see the shopkeeper policies listed above, they exist!
-- The issue might be with the policy logic or your account setup.
