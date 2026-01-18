-- ============================================
-- COMPLETE FIX: Shopkeeper Metadata & Policy
-- ============================================
-- The RLS policy checks raw_user_meta_data in the database
-- This ensures it's set correctly

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
-- This is what the RLS policy checks!
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('user_type', 'shopkeeper')
WHERE email = 'shopkeeper@cvbuilder.com';

-- Step 3: Also ensure user_metadata is set (for client-side access)
UPDATE auth.users
SET user_metadata = COALESCE(user_metadata, '{}'::jsonb) || 
    jsonb_build_object('user_type', 'shopkeeper')
WHERE email = 'shopkeeper@cvbuilder.com';

-- Step 4: Verify the update
SELECT 
  id,
  email,
  raw_user_meta_data,
  raw_user_meta_data->>'user_type' as user_type_from_raw,
  user_metadata,
  user_metadata->>'user_type' as user_type_from_metadata,
  CASE 
    WHEN raw_user_meta_data->>'user_type' = 'shopkeeper' THEN '✅ raw_user_meta_data is correct'
    ELSE '❌ raw_user_meta_data is missing or incorrect'
  END as raw_metadata_status,
  CASE 
    WHEN user_metadata->>'user_type' = 'shopkeeper' THEN '✅ user_metadata is correct'
    ELSE '❌ user_metadata is missing or incorrect'
  END as metadata_status
FROM auth.users
WHERE email = 'shopkeeper@cvbuilder.com';

-- Step 5: Test the policy condition
-- This simulates what the RLS policy checks
SELECT 
  id as user_id,
  email,
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = (SELECT id FROM auth.users WHERE email = 'shopkeeper@cvbuilder.com')
    AND (raw_user_meta_data->>'user_type')::text = 'shopkeeper'
  ) as policy_condition_result
FROM auth.users
WHERE email = 'shopkeeper@cvbuilder.com';

-- The policy_condition_result should be TRUE for the upload to work
