-- Complete Fix for CV Builder Authentication and Database Issues
-- Run this in Supabase SQL Editor

-- Step 1: Create user account
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

-- Step 2: Fix RLS policies for user_cvs table
-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Users can insert their own CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Users can update their own CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Users can delete their own CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Admins can view all user CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.user_cvs;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.user_cvs;

-- Create a simple policy that allows all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON public.user_cvs
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 3: Test the setup
-- Verify user was created
SELECT 
    'User created' as status,
    u.id,
    u.email,
    u.raw_user_meta_data->>'role' as role
FROM auth.users u 
WHERE u.email = 'abdurrehman587@gmail.com';

-- Test table access
SELECT 'Table accessible' as status, COUNT(*) as record_count FROM public.user_cvs;

-- Insert a test record
INSERT INTO public.user_cvs (user_id, name, email, cv_name) 
VALUES ('test_user_' || extract(epoch from now()), 'Test User', 'test@example.com', 'Test CV')
ON CONFLICT DO NOTHING;

-- Verify test record was inserted
SELECT 'Test record inserted' as status, COUNT(*) as total_records FROM public.user_cvs;

-- Clean up test data
DELETE FROM public.user_cvs WHERE user_id LIKE 'test_user_%';
