-- ============================================
-- CREATE SHOPKEEPER STORAGE POLICIES
-- ============================================
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- Then click "Run" button (or press Ctrl+Enter)
-- ============================================

-- Step 1: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Shopkeepers can upload marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Shopkeepers can view marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Shopkeepers can update marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Shopkeepers can delete marketplace images" ON storage.objects;

-- Step 2: Create the UPLOAD policy (THIS FIXES YOUR ERROR!)
CREATE POLICY "Shopkeepers can upload marketplace images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'marketplace-images' AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'user_type')::text = 'shopkeeper'
    )
  );

-- Step 3: Create the VIEW policy
CREATE POLICY "Shopkeepers can view marketplace images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'marketplace-images'
  );

-- Step 4: Create the UPDATE policy
CREATE POLICY "Shopkeepers can update marketplace images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'marketplace-images' AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'user_type')::text = 'shopkeeper'
    )
  );

-- Step 5: Create the DELETE policy
CREATE POLICY "Shopkeepers can delete marketplace images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'marketplace-images' AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'user_type')::text = 'shopkeeper'
    )
  );

-- ============================================
-- VERIFICATION (Run this AFTER the above script)
-- ============================================
-- After running the script above, run this query to verify policies were created:
-- 
-- SELECT policyname 
-- FROM pg_policies 
-- WHERE schemaname = 'storage' 
--   AND tablename = 'objects'
--   AND policyname LIKE '%shopkeeper%';
--
-- You should see 4 policies listed.
-- ============================================
