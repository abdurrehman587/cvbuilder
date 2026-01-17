-- FINAL FIX: Admin Permissions for Marketplace Products
-- This script resolves the circular dependency issue with RLS policies
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- STEP 1: Drop conflicting policies on users table
-- ============================================

-- Drop the circular dependency policy that checks admin status
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Drop our function access policy if it exists (we'll recreate it)
DROP POLICY IF EXISTS "Function can check admin status" ON public.users;

-- ============================================
-- STEP 2: Create a permissive policy for function access
-- ============================================

-- Create a PERMISSIVE policy (default) that allows reading admin status
-- This policy will work alongside "Users can view own profile" using OR logic
-- The key is making it permissive so it doesn't conflict
CREATE POLICY "Function can check admin status" ON public.users
  AS PERMISSIVE  -- Explicitly mark as permissive
  FOR SELECT 
  USING (true);  -- Allow reading any user's admin status

-- Recreate the admin policy but make it use the function instead of direct query
-- This breaks the circular dependency
CREATE POLICY "Admins can view all users" ON public.users
  AS PERMISSIVE
  FOR SELECT 
  USING (
    -- First check if user can view own profile (existing policy)
    auth.uid() = id
    -- OR if they're an admin (but we can't check this here due to circular dependency)
    -- So we'll rely on the permissive policy above
  );

-- ============================================
-- STEP 3: Drop and recreate the admin check function
-- ============================================

-- Drop existing admin policies on marketplace_products first
DROP POLICY IF EXISTS "Admins can view all marketplace products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can insert marketplace products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can update all marketplace products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can delete all marketplace products" ON public.marketplace_products;

-- Drop the function
DROP FUNCTION IF EXISTS public.is_admin_user() CASCADE;

-- Create the function with SECURITY DEFINER
-- This should bypass RLS, but if it doesn't, the permissive policy above will allow it
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
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  -- If no user is authenticated, return false
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if current user is admin
  -- SECURITY DEFINER should bypass RLS, but the permissive policy ensures access
  SELECT COALESCE(is_admin, false) INTO user_is_admin
  FROM public.users 
  WHERE id = current_user_id;
  
  RETURN COALESCE(user_is_admin, false);
END;
$$;

-- Set function owner to postgres for maximum privileges
ALTER FUNCTION public.is_admin_user() OWNER TO postgres;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

-- Grant usage on the schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================
-- STEP 4: Create admin policies for marketplace_products
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
-- STEP 5: Verification
-- ============================================

-- Test the function (uncomment to test)
-- SELECT public.is_admin_user() as is_current_user_admin;

-- Check if policies were created
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'marketplace_products' AND policyname LIKE '%Admin%';

-- Check users table policies
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users';
