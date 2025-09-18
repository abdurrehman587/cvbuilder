-- Check user account status and fix authentication issues
-- Run this in Supabase SQL Editor

-- Step 1: Check if user exists and get current status
SELECT 
    'User Status Check' as step,
    u.id,
    u.email,
    u.raw_user_meta_data->>'role' as role,
    u.raw_user_meta_data->>'name' as name,
    u.email_confirmed_at,
    u.created_at,
    u.updated_at,
    CASE 
        WHEN u.email_confirmed_at IS NOT NULL THEN 'Email confirmed'
        ELSE 'Email not confirmed'
    END as email_status
FROM auth.users u 
WHERE u.email = 'abdurrehman587@gmail.com';

-- Step 2: Reset password to a known value
UPDATE auth.users 
SET 
    encrypted_password = crypt('password123', gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'abdurrehman587@gmail.com';

-- Step 3: Ensure user has proper role metadata
UPDATE auth.users 
SET 
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "user", "name": "Abdur Rehman"}'::jsonb,
    updated_at = NOW()
WHERE email = 'abdurrehman587@gmail.com';

-- Step 4: Confirm email if not already confirmed
UPDATE auth.users 
SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'abdurrehman587@gmail.com' 
AND email_confirmed_at IS NULL;

-- Step 5: Final verification
SELECT 
    'Final Status' as step,
    u.id,
    u.email,
    u.raw_user_meta_data->>'role' as role,
    u.raw_user_meta_data->>'name' as name,
    u.email_confirmed_at,
    CASE 
        WHEN u.email_confirmed_at IS NOT NULL THEN 'Ready to login'
        ELSE 'Email confirmation needed'
    END as login_status
FROM auth.users u 
WHERE u.email = 'abdurrehman587@gmail.com';
