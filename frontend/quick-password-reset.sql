-- Quick password reset for existing user
-- Run this in Supabase SQL Editor

-- Reset password and ensure proper metadata
UPDATE auth.users 
SET 
    encrypted_password = crypt('password123', gen_salt('bf')),
    raw_user_meta_data = '{"role": "user", "name": "Abdur Rehman"}'::jsonb,
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'abdurrehman587@gmail.com';

-- Verify the update
SELECT 
    'Password Reset Complete' as status,
    u.id,
    u.email,
    u.raw_user_meta_data->>'role' as role,
    u.raw_user_meta_data->>'name' as name,
    u.email_confirmed_at,
    'Ready for login' as login_status
FROM auth.users u 
WHERE u.email = 'abdurrehman587@gmail.com';
