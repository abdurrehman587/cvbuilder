-- Fix Admin Permissions for Marketplace Products
-- Run this SQL in Supabase SQL Editor to fix the 403 permission denied error
-- This script creates a helper function and updates RLS policies for admins

-- Step 1: Create or replace the is_admin_user() function
-- This function runs with elevated privileges (SECURITY DEFINER) to bypass RLS
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$;

-- Step 2: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

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
