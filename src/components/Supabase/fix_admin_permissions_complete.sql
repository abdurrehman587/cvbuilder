-- Complete Fix for Admin Permissions on Marketplace Products
-- This script ensures admins can manage all marketplace products
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- PART 1: Ensure users table allows function access
-- ============================================

-- First, ensure there's a policy on users table that allows reading admin status
-- This is needed for the SECURITY DEFINER function to work
DROP POLICY IF EXISTS "Function can check admin status" ON public.users;

CREATE POLICY "Function can check admin status" ON public.users
  FOR SELECT 
  USING (true);  -- Allow function to read any user's admin status

-- ============================================
-- PART 2: Create/Update the admin check function
-- ============================================

-- Drop existing admin policies first (they depend on the function)
DROP POLICY IF EXISTS "Admins can view all marketplace products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can insert marketplace products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can update all marketplace products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can delete all marketplace products" ON public.marketplace_products;

-- Drop the function
DROP FUNCTION IF EXISTS public.is_admin_user();

-- Create the function with proper security settings
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_is_admin boolean;
BEGIN
  -- Check if current user is admin in public.users table
  -- SECURITY DEFINER allows this to bypass RLS on public.users
  SELECT EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = auth.uid() 
      AND is_admin = TRUE
  ) INTO user_is_admin;
  
  RETURN COALESCE(user_is_admin, false);
END;
$$;

-- Set function owner to postgres (or service_role) for proper permissions
ALTER FUNCTION public.is_admin_user() OWNER TO postgres;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

-- Grant usage on the schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================
-- PART 3: Create admin policies for marketplace_products
-- ============================================

-- Policy: Admins can view all products (including hidden ones)
CREATE POLICY "Admins can view all marketplace products" ON public.marketplace_products
  FOR SELECT USING (public.is_admin_user());

-- Policy: Admins can insert products (shopkeeper_id will be NULL for admin-created products)
CREATE POLICY "Admins can insert marketplace products" ON public.marketplace_products
  FOR INSERT WITH CHECK (public.is_admin_user());

-- Policy: Admins can update all products
CREATE POLICY "Admins can update all marketplace products" ON public.marketplace_products
  FOR UPDATE USING (public.is_admin_user());

-- Policy: Admins can delete all products
CREATE POLICY "Admins can delete all marketplace products" ON public.marketplace_products
  FOR DELETE USING (public.is_admin_user());

-- ============================================
-- PART 4: Verification
-- ============================================

-- Test the function (should return true if you're an admin)
-- SELECT public.is_admin_user();

-- Check if policies were created
-- SELECT policyname FROM pg_policies WHERE tablename = 'marketplace_products' AND policyname LIKE '%Admin%';
