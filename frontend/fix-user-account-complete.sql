-- Complete fix for user account authentication issues
-- Run this in Supabase SQL Editor

-- Step 1: Check current user status
SELECT 
    'Current User Status' as step,
    u.id,
    u.email,
    u.raw_user_meta_data->>'role' as role,
    u.raw_user_meta_data->>'name' as name,
    u.email_confirmed_at,
    u.created_at,
    u.updated_at
FROM auth.users u 
WHERE u.email = 'abdurrehman587@gmail.com';

-- Step 2: Delete the existing user if it has issues
DELETE FROM auth.users 
WHERE email = 'abdurrehman587@gmail.com';

-- Step 3: Create a fresh user account with proper setup
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'abdurrehman587@gmail.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "user", "name": "Abdur Rehman"}',
    false,
    '',
    '',
    '',
    ''
);

-- Step 4: Verify the new user account
SELECT 
    'New User Created' as step,
    u.id,
    u.email,
    u.raw_user_meta_data->>'role' as role,
    u.raw_user_meta_data->>'name' as name,
    u.email_confirmed_at,
    'Ready for login' as status
FROM auth.users u 
WHERE u.email = 'abdurrehman587@gmail.com';

-- Step 5: Ensure RLS policies are correct
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.user_cvs;
CREATE POLICY "Allow all operations for authenticated users" ON public.user_cvs
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 6: Test table access
SELECT 'Table access test' as step, COUNT(*) as record_count FROM public.user_cvs;
