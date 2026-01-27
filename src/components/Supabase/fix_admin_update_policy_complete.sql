-- Complete Fix for Admin Update Policy for marketplace_products
-- This fixes the RLS policy to allow admins to update products
-- Run this in Supabase SQL Editor

-- Step 1: Verify is_admin_user() function exists and works
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'is_admin_user'
  ) THEN
    RAISE EXCEPTION 'is_admin_user() function does not exist. Please run shopkeeper_products_system.sql first.';
  END IF;
END $$;

-- Step 2: Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can update all marketplace products" ON public.marketplace_products;

-- Step 3: Create the policy with both USING and WITH CHECK clauses
-- USING: determines which existing rows can be updated
-- WITH CHECK: determines what values the updated rows can have
CREATE POLICY "Admins can update all marketplace products" ON public.marketplace_products
  FOR UPDATE 
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Step 4: Verify the policy was created
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'marketplace_products'
    AND policyname = 'Admins can update all marketplace products';
  
  IF policy_count = 0 THEN
    RAISE EXCEPTION 'Policy creation failed!';
  ELSE
    RAISE NOTICE 'Policy created successfully!';
  END IF;
END $$;

-- Step 5: Grant necessary permissions (if not already granted)
GRANT UPDATE ON public.marketplace_products TO authenticated;
GRANT SELECT ON public.marketplace_products TO authenticated;
