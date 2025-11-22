-- Marketplace Storage RLS Policies Fix
-- Run this in your Supabase SQL Editor to fix image upload permissions
-- This allows admin users to upload, update, and delete images in the marketplace-images bucket

-- Step 1: Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketplace-images', 'marketplace-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Step 2: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete marketplace images" ON storage.objects;

-- Step 3: Create RLS policies for marketplace-images storage bucket
-- Allow everyone to view images (public bucket)
CREATE POLICY "Anyone can view marketplace images" ON storage.objects
  FOR SELECT USING (bucket_id = 'marketplace-images');

-- Allow admins to upload images
CREATE POLICY "Admins can upload marketplace images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'marketplace-images' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Allow admins to update images
CREATE POLICY "Admins can update marketplace images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'marketplace-images' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Allow admins to delete images
CREATE POLICY "Admins can delete marketplace images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'marketplace-images' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Verify the policies were created
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
WHERE tablename = 'objects' AND policyname LIKE '%marketplace%';

