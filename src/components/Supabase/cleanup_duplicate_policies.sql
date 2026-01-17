-- Cleanup Duplicate Admin Policies
-- This script removes duplicate policies and keeps only the ones using is_admin_user()
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Drop duplicate/old policies
-- ============================================

-- Drop old policies that use direct queries (these cause the permission error)
DROP POLICY IF EXISTS "Admins can delete products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can update products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can view products" ON public.marketplace_products;

-- Keep the ones using is_admin_user() - these are the correct ones
-- But let's recreate them to ensure they're correct

-- ============================================
-- STEP 2: Drop and recreate policies with correct structure
-- ============================================

-- Drop all admin policies (we'll recreate them)
DROP POLICY IF EXISTS "Admins can view all marketplace products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can insert marketplace products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can update all marketplace products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can delete all marketplace products" ON public.marketplace_products;

-- ============================================
-- STEP 3: Recreate policies with correct structure
-- ============================================

-- Policy: Admins can view all products
CREATE POLICY "Admins can view all marketplace products" ON public.marketplace_products
  FOR SELECT 
  USING (public.is_admin_user());

-- Policy: Admins can insert products
CREATE POLICY "Admins can insert marketplace products" ON public.marketplace_products
  FOR INSERT 
  WITH CHECK (public.is_admin_user());

-- Policy: Admins can update all products
CREATE POLICY "Admins can update all marketplace products" ON public.marketplace_products
  FOR UPDATE 
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Policy: Admins can delete all products
CREATE POLICY "Admins can delete all marketplace products" ON public.marketplace_products
  FOR DELETE 
  USING (public.is_admin_user());

-- ============================================
-- STEP 4: Verify policies
-- ============================================

-- Check that only the correct policies exist
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'marketplace_products'
  AND policyname LIKE '%Admin%'
ORDER BY cmd, policyname;
