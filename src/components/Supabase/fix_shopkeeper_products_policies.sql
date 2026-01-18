-- ============================================
-- FIX: Shopkeeper Products RLS Policies
-- ============================================
-- The policies are trying to query auth.users directly, which fails in RLS context
-- Solution: Use the is_shopkeeper_user() function we created earlier

-- ============================================
-- STEP 1: Ensure is_shopkeeper_user() function exists
-- ============================================
-- This should already exist from the storage fix, but let's make sure
CREATE OR REPLACE FUNCTION is_shopkeeper_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'user_type')::text = 'shopkeeper'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_shopkeeper_user() TO authenticated;

-- ============================================
-- STEP 2: Drop existing shopkeeper policies
-- ============================================
DROP POLICY IF EXISTS "Shopkeepers can view their own products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Shopkeepers can insert their own products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Shopkeepers can update their own products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Shopkeepers can delete their own products" ON public.marketplace_products;

-- ============================================
-- STEP 3: Recreate policies using the function
-- ============================================

-- Policy: Shopkeepers can view their own products (including hidden ones)
CREATE POLICY "Shopkeepers can view their own products" ON public.marketplace_products
  FOR SELECT USING (
    shopkeeper_id = auth.uid() 
    AND is_shopkeeper_user() = true
  );

-- Policy: Shopkeepers can insert their own products
CREATE POLICY "Shopkeepers can insert their own products" ON public.marketplace_products
  FOR INSERT WITH CHECK (
    shopkeeper_id = auth.uid() 
    AND is_shopkeeper_user() = true
  );

-- Policy: Shopkeepers can update their own products
CREATE POLICY "Shopkeepers can update their own products" ON public.marketplace_products
  FOR UPDATE USING (
    shopkeeper_id = auth.uid() 
    AND is_shopkeeper_user() = true
  );

-- Policy: Shopkeepers can delete their own products
CREATE POLICY "Shopkeepers can delete their own products" ON public.marketplace_products
  FOR DELETE USING (
    shopkeeper_id = auth.uid() 
    AND is_shopkeeper_user() = true
  );

-- ============================================
-- STEP 4: Verify policies were created
-- ============================================
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN with_check LIKE '%is_shopkeeper_user()%' OR qual LIKE '%is_shopkeeper_user()%' THEN '✅ Uses function'
    ELSE '⚠️ Does not use function'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'marketplace_products'
  AND policyname LIKE '%Shopkeeper%'
ORDER BY cmd, policyname;

-- ============================================
-- IMPORTANT: After running this script
-- ============================================
-- 1. The policies now use the function instead of querying auth.users directly
-- 2. Try adding a product again - it should work now!
-- ============================================
