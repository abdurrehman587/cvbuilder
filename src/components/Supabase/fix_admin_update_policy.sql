-- Fix Admin Update Policy for marketplace_products
-- This adds the missing WITH CHECK clause to allow admins to update products

-- Drop and recreate the admin update policy with both USING and WITH CHECK
DROP POLICY IF EXISTS "Admins can update all marketplace products" ON public.marketplace_products;

CREATE POLICY "Admins can update all marketplace products" ON public.marketplace_products
  FOR UPDATE 
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());
