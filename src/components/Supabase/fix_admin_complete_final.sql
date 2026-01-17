-- COMPLETE FINAL FIX: Ensure everything uses auth metadata only
-- This script ensures ALL admin checks use auth metadata, no public.users queries
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Update is_admin_user() to ONLY use auth metadata
-- ============================================

DROP FUNCTION IF EXISTS public.is_admin_user() CASCADE;

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
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- ONLY check auth metadata - NO fallback to public.users
  -- This completely avoids RLS issues
  BEGIN
    SELECT COALESCE(
      (raw_user_meta_data->>'is_admin')::boolean,
      false
    ) INTO is_admin_from_metadata
    FROM auth.users
    WHERE id = current_user_id
    LIMIT 1;
    
    RETURN COALESCE(is_admin_from_metadata, false);
  EXCEPTION
    WHEN OTHERS THEN
      -- If we can't read from auth.users, return false
      -- Never try public.users as it has RLS
      RETURN false;
  END;
END;
$$;

ALTER FUNCTION public.is_admin_user() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

-- ============================================
-- STEP 2: Update RPC function to ONLY use is_admin_user() (no direct queries)
-- ============================================

DROP FUNCTION IF EXISTS public.admin_update_product CASCADE;

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
  
  -- ONLY use the is_admin_user() function - NO direct queries to public.users
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
-- STEP 3: Ensure all admin statuses are synced to auth metadata
-- ============================================

-- Run the sync function to ensure all admins are in auth metadata
SELECT public.sync_admin_to_auth_metadata();

-- ============================================
-- STEP 4: Verify your admin status is in auth metadata
-- ============================================

-- Check if your user has admin status in auth metadata
-- Replace 'your-email@example.com' with your actual email
-- SELECT 
--   id,
--   email,
--   raw_user_meta_data->>'is_admin' as is_admin_metadata,
--   raw_user_meta_data->>'user_type' as user_type_metadata
-- FROM auth.users
-- WHERE email = 'your-email@example.com';

-- If is_admin_metadata is NULL or false, you need to manually set it:
-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{is_admin}',
--   'true'::jsonb
-- )
-- WHERE email = 'your-email@example.com';

-- ============================================
-- STEP 5: Test the function
-- ============================================

-- Test if the function works (should return true if you're an admin)
-- SELECT public.is_admin_user() as is_admin;
