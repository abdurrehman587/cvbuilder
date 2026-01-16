-- Fix Admin Permissions for Marketplace Products
-- Run this SQL in Supabase SQL Editor to fix the 403 permission denied error
-- This script creates a helper function and updates RLS policies for admins

-- IMPORTANT: Make sure you're logged in as a user with admin privileges in Supabase
-- when running this script. The function will be created with SECURITY DEFINER,
-- which means it runs with the privileges of the function owner (postgres by default).

-- Step 1: Drop the function if it exists (to ensure clean creation)
DROP FUNCTION IF EXISTS public.is_admin_user();

-- Step 2: Create or replace the is_admin_user() function
-- This function runs with elevated privileges (SECURITY DEFINER) to bypass RLS
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  -- Check if current user is admin in public.users table
  -- SECURITY DEFINER allows this to bypass RLS on public.users
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$;

-- Step 3: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

-- Step 4: Grant usage on the schema (if needed)
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 3: Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all marketplace products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can insert marketplace products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can update all marketplace products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can delete all marketplace products" ON public.marketplace_products;

-- Step 4: Create new admin policies using the helper function
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

-- Verification: You can test the function with:
-- SELECT public.is_admin_user();
