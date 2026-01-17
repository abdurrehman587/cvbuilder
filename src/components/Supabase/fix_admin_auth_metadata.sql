-- AUTH METADATA FIX: Store Admin Status in Auth Metadata
-- This approach stores admin status in auth.users.raw_user_meta_data
-- which doesn't have RLS restrictions
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- STEP 1: Drop existing functions and policies
-- ============================================

DROP POLICY IF EXISTS "Admins can view all marketplace products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can insert marketplace products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can update all marketplace products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can delete all marketplace products" ON public.marketplace_products;

DROP FUNCTION IF EXISTS public.is_admin_user() CASCADE;
DROP FUNCTION IF EXISTS public.admin_update_product CASCADE;

-- ============================================
-- STEP 2: Create admin check using auth metadata (no RLS!)
-- ============================================

-- This function reads from auth.users.raw_user_meta_data
-- which doesn't have RLS restrictions
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  current_user_id uuid;
  is_admin_from_metadata boolean;
  is_admin_from_db boolean;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- First, try to get admin status from auth metadata (no RLS!)
  BEGIN
    SELECT COALESCE(
      (raw_user_meta_data->>'is_admin')::boolean,
      false
    ) INTO is_admin_from_metadata
    FROM auth.users
    WHERE id = current_user_id
    LIMIT 1;
    
    IF is_admin_from_metadata THEN
      RETURN true;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- If we can't read from auth.users, continue to fallback
      is_admin_from_metadata := false;
  END;
  
  -- Fallback: Try to read from public.users (might work with existing policies)
  BEGIN
    SELECT COALESCE(is_admin, false) INTO is_admin_from_db
    FROM public.users
    WHERE id = current_user_id
    LIMIT 1;
    
    RETURN COALESCE(is_admin_from_db, false);
  EXCEPTION
    WHEN OTHERS THEN
      -- If we can't read from public.users either, return false
      RETURN false;
  END;
END;
$$;

ALTER FUNCTION public.is_admin_user() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

-- ============================================
-- STEP 3: Create function to sync admin status to auth metadata
-- ============================================

-- This function syncs is_admin from public.users to auth.users metadata
-- Run this periodically or when admin status changes
CREATE OR REPLACE FUNCTION public.sync_admin_to_auth_metadata()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update auth.users metadata with admin status from public.users
  UPDATE auth.users au
  SET raw_user_meta_data = jsonb_set(
    COALESCE(au.raw_user_meta_data, '{}'::jsonb),
    '{is_admin}',
    to_jsonb(COALESCE(pu.is_admin, false))
  )
  FROM public.users pu
  WHERE au.id = pu.id;
END;
$$;

ALTER FUNCTION public.sync_admin_to_auth_metadata() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.sync_admin_to_auth_metadata() TO authenticated;

-- ============================================
-- STEP 4: Create RPC function for admin product updates
-- ============================================

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
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check admin status using the function (reads from auth metadata first)
  SELECT public.is_admin_user() INTO is_admin_user;
  
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
-- STEP 5: Create admin policies
-- ============================================

CREATE POLICY "Admins can view all marketplace products" ON public.marketplace_products
  FOR SELECT USING (public.is_admin_user());

CREATE POLICY "Admins can insert marketplace products" ON public.marketplace_products
  FOR INSERT WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can update all marketplace products" ON public.marketplace_products
  FOR UPDATE USING (public.is_admin_user());

CREATE POLICY "Admins can delete all marketplace products" ON public.marketplace_products
  FOR DELETE USING (public.is_admin_user());

-- ============================================
-- STEP 6: Sync admin status to auth metadata
-- ============================================

-- Run this to sync all existing admin statuses to auth metadata
SELECT public.sync_admin_to_auth_metadata();

-- ============================================
-- STEP 7: Create trigger to auto-sync admin status
-- ============================================

-- Create a trigger that syncs admin status to auth metadata when it changes
CREATE OR REPLACE FUNCTION public.trigger_sync_admin_to_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update auth.users metadata when is_admin changes in public.users
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{is_admin}',
    to_jsonb(COALESCE(NEW.is_admin, false))
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS sync_admin_to_auth_trigger ON public.users;

-- Create trigger
CREATE TRIGGER sync_admin_to_auth_trigger
  AFTER INSERT OR UPDATE OF is_admin ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_sync_admin_to_auth();

-- ============================================
-- STEP 8: Grant permissions
-- ============================================

GRANT SELECT ON public.users TO postgres;
GRANT ALL ON public.marketplace_products TO postgres;

-- ============================================
-- VERIFICATION
-- ============================================

-- Test the function:
-- SELECT public.is_admin_user() as is_admin;

-- Check if admin status is in auth metadata:
-- SELECT id, email, raw_user_meta_data->>'is_admin' as is_admin_metadata
-- FROM auth.users
-- WHERE raw_user_meta_data->>'is_admin' = 'true';
