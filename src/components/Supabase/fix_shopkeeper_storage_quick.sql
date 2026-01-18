-- QUICK FIX: Shopkeeper Storage Policies
-- Copy and paste this ENTIRE script into Supabase SQL Editor and run it

-- Step 1: Drop existing policies if they exist
DROP POLICY IF EXISTS "Shopkeepers can upload marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Shopkeepers can view marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Shopkeepers can update marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Shopkeepers can delete marketplace images" ON storage.objects;

-- Step 2: Create the upload policy (THIS IS THE CRITICAL ONE FOR YOUR ERROR)
CREATE POLICY "Shopkeepers can upload marketplace images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'marketplace-images' AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'user_type')::text = 'shopkeeper'
    )
  );

-- Step 3: Create view policy
CREATE POLICY "Shopkeepers can view marketplace images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'marketplace-images'
  );

-- Step 4: Create update policy
CREATE POLICY "Shopkeepers can update marketplace images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'marketplace-images' AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'user_type')::text = 'shopkeeper'
    )
  );

-- Step 5: Create delete policy
CREATE POLICY "Shopkeepers can delete marketplace images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'marketplace-images' AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'user_type')::text = 'shopkeeper'
    )
  );

-- Step 6: Verify your shopkeeper account has user_type set
-- Run this separately to check:
SELECT 
  u.email,
  u.raw_user_meta_data->>'user_type' as user_type,
  pu.is_admin
FROM auth.users u
LEFT JOIN public.users pu ON u.id = pu.id
WHERE u.email = 'shopkeeper@cvbuilder.com';

-- If user_type is NULL, run this to fix it:
-- UPDATE auth.users
-- SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
--     jsonb_build_object('user_type', 'shopkeeper')
-- WHERE email = 'shopkeeper@cvbuilder.com';

-- Step 7: Verify policies were created
SELECT policyname 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%shopkeeper%';
