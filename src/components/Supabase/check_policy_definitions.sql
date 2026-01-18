-- ============================================
-- CHECK SHOPKEEPER POLICY DEFINITIONS
-- ============================================
-- This shows the actual policy definitions to verify they're correct

SELECT 
  policyname,
  cmd,
  qual as USING_clause,
  with_check as WITH_CHECK_clause
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%shopkeeper%'
ORDER BY cmd;

-- The WITH_CHECK clause for INSERT is what matters for uploads
-- It should check: bucket_id = 'marketplace-images' AND user_type = 'shopkeeper'
