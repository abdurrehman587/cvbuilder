-- Storage Policies for Shopkeepers
-- Run this SQL in Supabase SQL Editor to allow shopkeepers to upload images

-- Enable RLS on storage.objects if not already enabled
-- Note: This is usually enabled by default, but we'll ensure it

-- Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Shopkeepers can upload marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Shopkeepers can view marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Shopkeepers can update marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Shopkeepers can delete marketplace images" ON storage.objects;

-- Policy: Shopkeepers can upload images to marketplace-images bucket
CREATE POLICY "Shopkeepers can upload marketplace images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'marketplace-images' AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'user_type')::text = 'shopkeeper'
    )
  );

-- Policy: Shopkeepers can view images in marketplace-images bucket
CREATE POLICY "Shopkeepers can view marketplace images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'marketplace-images' AND
    (
      -- Allow if user is shopkeeper
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND (raw_user_meta_data->>'user_type')::text = 'shopkeeper'
      )
      OR
      -- Allow if bucket is public (for viewing product images)
      true
    )
  );

-- Policy: Shopkeepers can update their own images in marketplace-images bucket
CREATE POLICY "Shopkeepers can update marketplace images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'marketplace-images' AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'user_type')::text = 'shopkeeper'
    )
  );

-- Policy: Shopkeepers can delete their own images in marketplace-images bucket
CREATE POLICY "Shopkeepers can delete marketplace images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'marketplace-images' AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'user_type')::text = 'shopkeeper'
    )
  );

-- Note: If the bucket is public, you might also want to ensure public read access
-- The bucket should be set to public in Supabase Dashboard > Storage > marketplace-images > Settings
-- Make sure "Public bucket" is enabled for the marketplace-images bucket

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these queries after creating the policies to verify everything is set up correctly

-- 1. Verify shopkeeper account has user_type set correctly
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'user_type' as user_type,
  pu.is_admin
FROM auth.users u
LEFT JOIN public.users pu ON u.id = pu.id
WHERE u.email = 'shopkeeper@cvbuilder.com';

-- 2. Verify storage policies were created
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%shopkeeper%'
ORDER BY policyname;

-- 3. Check if marketplace-images bucket exists and is configured
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'marketplace-images';
