-- Fix Admin Insert Policy for marketplace_products
-- This ensures admins can insert products
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
DROP POLICY IF EXISTS "Admins can insert marketplace products" ON public.marketplace_products;

-- Step 3: Create the INSERT policy with WITH CHECK clause
-- For INSERT operations, we only need WITH CHECK (not USING)
CREATE POLICY "Admins can insert marketplace products" ON public.marketplace_products
  FOR INSERT 
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
    AND policyname = 'Admins can insert marketplace products';
  
  IF policy_count = 0 THEN
    RAISE EXCEPTION 'Policy creation failed!';
  ELSE
    RAISE NOTICE 'Admin INSERT policy created successfully!';
  END IF;
END $$;

-- Step 5: Grant necessary permissions (if not already granted)
GRANT INSERT ON public.marketplace_products TO authenticated;
GRANT SELECT ON public.marketplace_products TO authenticated;

-- Step 6: Verify the is_admin_user() function works for current user
DO $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT public.is_admin_user() INTO is_admin;
  IF is_admin THEN
    RAISE NOTICE 'Current user is an admin - INSERT should work!';
  ELSE
    RAISE NOTICE 'Current user is NOT an admin - make sure you are logged in as an admin user.';
  END IF;
END $$;
