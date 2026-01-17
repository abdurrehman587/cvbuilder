-- WORKING FIX: Admin Permissions for Marketplace Products
-- This script uses a more direct approach to bypass RLS issues
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- STEP 1: Temporarily disable RLS to fix policies
-- ============================================

-- We'll work with RLS enabled, but ensure policies are correct

-- ============================================
-- STEP 2: Drop ALL existing policies and function
-- ============================================

-- Drop admin policies on marketplace_products
DROP POLICY IF EXISTS "Admins can view all marketplace products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can insert marketplace products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can update all marketplace products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can delete all marketplace products" ON public.marketplace_products;

-- Drop the function (CASCADE to drop dependent policies)
DROP FUNCTION IF EXISTS public.is_admin_user() CASCADE;

-- Drop the problematic policy on users table
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Drop our function access policy if it exists
DROP POLICY IF EXISTS "Function can check admin status" ON public.users;

-- ============================================
-- STEP 3: Create a permissive policy on users table FIRST
-- ============================================

-- This policy MUST be created before the function
-- It allows reading admin status for any user (needed by the function)
CREATE POLICY "Function can check admin status" ON public.users
  AS PERMISSIVE
  FOR SELECT 
  USING (true);

-- ============================================
-- STEP 4: Create the admin check function
-- ============================================

-- Create function with SECURITY DEFINER
-- This runs with postgres privileges, but still respects RLS
-- The permissive policy above ensures it can read
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_is_admin boolean;
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Return false if not authenticated
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Query users table to check admin status
  -- The permissive policy above allows this to work
  SELECT COALESCE(is_admin, false) INTO user_is_admin
  FROM public.users 
  WHERE id = current_user_id
  LIMIT 1;
  
  RETURN COALESCE(user_is_admin, false);
END;
$$;

-- Set owner to postgres
ALTER FUNCTION public.is_admin_user() OWNER TO postgres;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================
-- STEP 5: Recreate admin policy on users table
-- ============================================

-- Recreate the admin policy using the function (no circular dependency)
CREATE POLICY "Admins can view all users" ON public.users
  AS PERMISSIVE
  FOR SELECT 
  USING (
    -- Users can view their own profile
    auth.uid() = id
    -- OR they are an admin (checked via function)
    OR public.is_admin_user()
  );

-- ============================================
-- STEP 6: Create admin policies for marketplace_products
-- ============================================

-- Policy: Admins can view all products
CREATE POLICY "Admins can view all marketplace products" ON public.marketplace_products
  FOR SELECT USING (public.is_admin_user());

-- Policy: Admins can insert products
CREATE POLICY "Admins can insert marketplace products" ON public.marketplace_products
  FOR INSERT WITH CHECK (public.is_admin_user());

-- Policy: Admins can update all products
CREATE POLICY "Admins can update all marketplace products" ON public.marketplace_products
  FOR UPDATE USING (public.is_admin_user());

-- Policy: Admins can delete all products
CREATE POLICY "Admins can delete all marketplace products" ON public.marketplace_products
  FOR DELETE USING (public.is_admin_user());

-- ============================================
-- STEP 7: Verification and Testing
-- ============================================

-- Test 1: Check if function exists and works
-- Uncomment to test (should return true if you're an admin):
-- SELECT public.is_admin_user() as is_admin;

-- Test 2: Check policies on marketplace_products
-- Uncomment to see all admin policies:
-- SELECT policyname, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'marketplace_products' 
--   AND policyname LIKE '%Admin%';

-- Test 3: Check policies on users table
-- Uncomment to see all policies:
-- SELECT policyname, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'users';

-- Test 4: Verify function owner and permissions
-- Uncomment to check:
-- SELECT 
--   p.proname as function_name,
--   pg_get_userbyid(p.proowner) as owner,
--   p.prosecdef as security_definer
-- FROM pg_proc p
-- WHERE p.proname = 'is_admin_user';
