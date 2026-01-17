-- AUTH METADATA ONLY FIX: Remove fallback to public.users
-- This version ONLY uses auth metadata, no fallback to public.users
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Update is_admin_user() to ONLY use auth metadata
-- ============================================

-- Drop and recreate the function to ONLY use auth metadata
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
  -- This avoids RLS issues completely
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
      -- This is safer than trying public.users which has RLS
      RETURN false;
  END;
END;
$$;

ALTER FUNCTION public.is_admin_user() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

-- ============================================
-- STEP 2: Ensure all admin statuses are synced to auth metadata
-- ============================================

-- Run the sync function to ensure all admins are in auth metadata
SELECT public.sync_admin_to_auth_metadata();

-- ============================================
-- STEP 3: Verify the function works
-- ============================================

-- Test the function (should return true if you're an admin)
-- SELECT public.is_admin_user() as is_admin;

-- Check which users have admin status in auth metadata
-- SELECT 
--   id,
--   email,
--   raw_user_meta_data->>'is_admin' as is_admin_metadata
-- FROM auth.users
-- WHERE raw_user_meta_data->>'is_admin' = 'true';
