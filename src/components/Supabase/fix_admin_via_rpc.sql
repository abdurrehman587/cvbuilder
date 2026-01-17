-- RPC FUNCTION FIX: Admin Permissions via Stored Procedure
-- This approach uses an RPC function instead of RLS policies
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- STEP 1: Drop existing admin policies
-- ============================================

DROP POLICY IF EXISTS "Admins can view all marketplace products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can insert marketplace products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can update all marketplace products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can delete all marketplace products" ON public.marketplace_products;

DROP FUNCTION IF EXISTS public.is_admin_user() CASCADE;
DROP FUNCTION IF EXISTS public.admin_update_product CASCADE;

-- ============================================
-- STEP 2: Create a simple admin check that uses auth.users
-- ============================================

-- Try using auth.users instead of public.users (might have different RLS)
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
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Try reading from public.users with explicit permission
  -- If this fails, the exception handler will catch it
  BEGIN
    SELECT COALESCE(is_admin, false) INTO user_is_admin
    FROM public.users 
    WHERE id = current_user_id
    LIMIT 1;
    
    RETURN COALESCE(user_is_admin, false);
  EXCEPTION
    WHEN OTHERS THEN
      -- If we can't read, try a different approach
      -- Return false to be safe
      RETURN false;
  END;
END;
$$;

ALTER FUNCTION public.is_admin_user() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

-- ============================================
-- STEP 3: Create RPC function for admin product updates
-- ============================================

-- This function allows admins to update products via RPC call
-- The frontend will call this instead of direct UPDATE
CREATE OR REPLACE FUNCTION public.admin_update_product(
  product_id uuid,
  product_name text,
  product_price numeric,
  product_original_price numeric DEFAULT NULL,
  product_image_urls text[] DEFAULT NULL,
  product_section_id uuid DEFAULT NULL,
  product_description text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  is_admin_user boolean;
  updated_product json;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if user is admin
  -- Try to read from users table
  BEGIN
    SELECT COALESCE(is_admin, false) INTO is_admin_user
    FROM public.users 
    WHERE id = current_user_id
    LIMIT 1;
  EXCEPTION
    WHEN OTHERS THEN
      -- If we can't check, deny access
      RAISE EXCEPTION 'Permission denied: Cannot verify admin status';
  END;
  
  IF NOT is_admin_user THEN
    RAISE EXCEPTION 'Permission denied: Admin access required';
  END IF;
  
  -- Update the product (bypassing RLS because we're SECURITY DEFINER)
  UPDATE public.marketplace_products
  SET
    name = product_name,
    price = product_price,
    original_price = product_original_price,
    image_urls = product_image_urls,
    image_url = CASE WHEN product_image_urls IS NOT NULL AND array_length(product_image_urls, 1) > 0 
                     THEN product_image_urls[1] 
                     ELSE NULL END,
    section_id = product_section_id,
    description = product_description,
    updated_at = now()
  WHERE id = product_id
  RETURNING to_jsonb(marketplace_products.*) INTO updated_product;
  
  IF updated_product IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  
  RETURN updated_product;
END;
$$;

ALTER FUNCTION public.admin_update_product(uuid, text, numeric, numeric, text[], uuid, text) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.admin_update_product(uuid, text, numeric, numeric, text[], uuid, text) TO authenticated;

-- ============================================
-- STEP 4: Create admin policies (as fallback)
-- ============================================

-- These policies will work if the function can check admin status
CREATE POLICY "Admins can view all marketplace products" ON public.marketplace_products
  FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admins can insert marketplace products" ON public.marketplace_products
  FOR INSERT WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can update all marketplace products" ON public.marketplace_products
  FOR UPDATE USING (public.is_admin_user());

CREATE POLICY "Admins can delete all marketplace products" ON public.marketplace_products
  FOR DELETE USING (public.is_admin_user());

-- ============================================
-- STEP 5: Grant explicit permissions
-- ============================================

-- Grant SELECT on users table to postgres
GRANT SELECT ON public.users TO postgres;

-- Grant all on marketplace_products to postgres (for the RPC function)
GRANT ALL ON public.marketplace_products TO postgres;
