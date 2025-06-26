-- Fix Admin RLS Policies
-- This script fixes the RLS policies to properly allow admin users to create/update CVs

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admin can view all CVs" ON cvs;
DROP POLICY IF EXISTS "Admin can insert CVs" ON cvs;
DROP POLICY IF EXISTS "Admin can update CVs" ON cvs;
DROP POLICY IF EXISTS "Admin can delete CVs" ON cvs;

-- Create new admin policies that allow authenticated users to work with admin CVs (user_id IS NULL)
-- These policies will allow any authenticated user to work with CVs that have user_id = NULL

-- Policy for admin to view all CVs (including admin CVs with user_id IS NULL)
CREATE POLICY "Admin can view all CVs" ON cvs
  FOR SELECT USING (
    user_id IS NULL OR 
    auth.uid() = user_id
  );

-- Policy for admin to insert CVs with user_id IS NULL
CREATE POLICY "Admin can insert CVs" ON cvs
  FOR INSERT WITH CHECK (
    user_id IS NULL OR 
    auth.uid() = user_id
  );

-- Policy for admin to update CVs with user_id IS NULL
CREATE POLICY "Admin can update CVs" ON cvs
  FOR UPDATE USING (
    user_id IS NULL OR 
    auth.uid() = user_id
  );

-- Policy for admin to delete CVs with user_id IS NULL
CREATE POLICY "Admin can delete CVs" ON cvs
  FOR DELETE USING (
    user_id IS NULL OR 
    auth.uid() = user_id
  );

-- Verify the policies
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
WHERE tablename = 'cvs'
ORDER BY policyname;

-- Test the policies by checking if we can insert a test record
-- This will help verify that the policies are working correctly
-- Note: This is just a verification query, not an actual insert
SELECT 
    'Policy verification' as status,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'cvs' 
AND policyname LIKE '%Admin%'; 