-- ============================================
-- CREATE SHOPKEEPER TEST ACCOUNT
-- ============================================
-- This script creates a test shopkeeper account: shopkeeper@cvbuilder.com
-- Similar to admin@cvbuilder.com but for shopkeeper testing
--
-- INSTRUCTIONS:
-- ============================================
-- METHOD 1: Via Supabase Dashboard (Recommended)
-- --------------------------------------------
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" button
-- 3. Enter:
--    - Email: shopkeeper@cvbuilder.com
--    - Password: shopkeeper123 (or any password you prefer)
--    - Auto Confirm User: CHECKED (for immediate access)
-- 4. Click "Create User"
-- 5. After user is created, run this SQL script below to set user_type
--
-- METHOD 2: Via App Signup Form
-- --------------------------------------------
-- 1. Go to your app at localhost:3000
-- 2. Click "Sign Up" 
-- 3. Enter:
--    - Email: shopkeeper@cvbuilder.com
--    - Password: shopkeeper123
--    - Select "Shopkeeper" as user type
-- 4. Complete signup
-- 5. Run this SQL script to ensure everything is set correctly
--
-- ============================================
-- SQL SCRIPT TO RUN AFTER USER IS CREATED
-- ============================================

-- Step 1: Find and update the shopkeeper user
DO $$
DECLARE
  shopkeeper_user_id UUID;
BEGIN
  -- Find the user by email
  SELECT id INTO shopkeeper_user_id
  FROM auth.users
  WHERE email = 'shopkeeper@cvbuilder.com';
  
  -- If user exists, set up shopkeeper account
  IF shopkeeper_user_id IS NOT NULL THEN
    -- Update auth.users metadata to set user_type as shopkeeper
    UPDATE auth.users
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object('user_type', 'shopkeeper')
    WHERE id = shopkeeper_user_id;
    
    -- Ensure user exists in public.users table
    INSERT INTO public.users (id, email, full_name, is_admin)
    VALUES (shopkeeper_user_id, 'shopkeeper@cvbuilder.com', 'Test Shopkeeper', false)
    ON CONFLICT (id) DO UPDATE
    SET email = 'shopkeeper@cvbuilder.com',
        full_name = 'Test Shopkeeper',
        is_admin = false;
    
    RAISE NOTICE '✅ Shopkeeper account set up successfully for shopkeeper@cvbuilder.com';
    RAISE NOTICE 'User ID: %', shopkeeper_user_id;
  ELSE
    RAISE NOTICE '❌ User shopkeeper@cvbuilder.com not found in auth.users.';
    RAISE NOTICE 'Please create the user first using METHOD 1 or METHOD 2 above.';
  END IF;
END $$;

-- Step 2: Verify the account was set up correctly
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'user_type' as user_type,
  pu.is_admin,
  pu.full_name,
  CASE 
    WHEN u.raw_user_meta_data->>'user_type' = 'shopkeeper' AND pu.is_admin = false THEN '✅ Correctly configured as Shopkeeper'
    WHEN pu.is_admin = true THEN '⚠️ WARNING: User is set as admin, not shopkeeper'
    WHEN u.raw_user_meta_data->>'user_type' IS NULL THEN '⚠️ WARNING: user_type not set in metadata'
    ELSE '⚠️ Configuration issue'
  END as status
FROM auth.users u
LEFT JOIN public.users pu ON u.id = pu.id
WHERE u.email = 'shopkeeper@cvbuilder.com';

-- ============================================
-- TEST LOGIN CREDENTIALS
-- ============================================
-- Email: shopkeeper@cvbuilder.com
-- Password: (whatever you set when creating the user)
--
-- After running this script, you can:
-- 1. Login at localhost:3000 with shopkeeper@cvbuilder.com
-- 2. Navigate to Marketplace
-- 3. You should see "My Products Management" panel
-- 4. You can add, edit, delete, and hide products
-- ============================================
