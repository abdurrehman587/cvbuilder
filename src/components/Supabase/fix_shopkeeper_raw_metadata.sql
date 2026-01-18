-- ============================================
-- FIX SHOPKEEPER RAW_USER_META_DATA
-- ============================================
-- The RLS policy checks raw_user_meta_data, but it might not be set correctly
-- This script ensures it's properly set

-- Step 1: Check current state
SELECT 
  id,
  email,
  raw_user_meta_data,
  raw_user_meta_data->>'user_type' as user_type_from_raw,
  user_metadata,
  user_metadata->>'user_type' as user_type_from_metadata
FROM auth.users
WHERE email = 'shopkeeper@cvbuilder.com';

-- Step 2: Update raw_user_meta_data to include user_type
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('user_type', 'shopkeeper')
WHERE email = 'shopkeeper@cvbuilder.com'
  AND (raw_user_meta_data->>'user_type' IS NULL 
       OR raw_user_meta_data->>'user_type' != 'shopkeeper');

-- Step 3: Verify the update
SELECT 
  id,
  email,
  raw_user_meta_data,
  raw_user_meta_data->>'user_type' as user_type_from_raw,
  user_metadata,
  user_metadata->>'user_type' as user_type_from_metadata
FROM auth.users
WHERE email = 'shopkeeper@cvbuilder.com';

-- You should see user_type_from_raw = 'shopkeeper' after running this
