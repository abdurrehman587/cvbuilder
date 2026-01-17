-- BYPASS RLS FIX: Admin Permissions for Marketplace Products
-- This script uses SET LOCAL to temporarily disable RLS within the function
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- STEP 1: Drop existing policies and function
-- ============================================

-- Drop admin policies on marketplace_products
DROP POLICY IF EXISTS "Admins can view all marketplace products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can insert marketplace products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can update all marketplace products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can delete all marketplace products" ON public.marketplace_products;

-- Drop the function
DROP FUNCTION IF EXISTS public.is_admin_user() CASCADE;

-- ============================================
-- STEP 2: Create the admin check function with RLS bypass
-- ============================================

-- Create function that temporarily disables RLS to read admin status
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
  rls_setting text;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Return false if not authenticated
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Temporarily disable RLS for this function execution
  -- This allows us to read from users table without RLS restrictions
  PERFORM set_config('row_security', 'off', true);
  
  -- Query users table to check admin status
  -- RLS is now disabled, so this will work
  SELECT COALESCE(is_admin, false) INTO user_is_admin
  FROM public.users 
  WHERE id = current_user_id
  LIMIT 1;
  
  -- Re-enable RLS (though it will reset after function ends anyway)
  PERFORM set_config('row_security', 'on', true);
  
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
-- STEP 3: Create admin policies for marketplace_products
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
-- STEP 4: Verification
-- ============================================

-- Test the function (uncomment to test):
-- SELECT public.is_admin_user() as is_admin;

-- Check policies:
-- SELECT policyname, cmd FROM pg_policies 
-- WHERE tablename = 'marketplace_products' 
--   AND policyname LIKE '%Admin%';
