-- Reset password for existing user account
-- Run this in Supabase SQL Editor

-- Update the password for the existing user
UPDATE auth.users 
SET 
    encrypted_password = crypt('password123', gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'abdurrehman587@gmail.com';

-- Verify the user exists and get their details
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'role' as role,
    u.raw_user_meta_data->>'name' as name,
    u.email_confirmed_at,
    u.created_at,
    u.updated_at
FROM auth.users u 
WHERE u.email = 'abdurrehman587@gmail.com';

-- If the user doesn't have a role, add it
UPDATE auth.users 
SET 
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "user", "name": "Abdur Rehman"}'::jsonb,
    updated_at = NOW()
WHERE email = 'abdurrehman587@gmail.com' 
AND (raw_user_meta_data->>'role' IS NULL OR raw_user_meta_data->>'role' = '');

-- Verify the role was set
SELECT 
    'User updated' as status,
    u.email,
    u.raw_user_meta_data->>'role' as role,
    u.raw_user_meta_data->>'name' as name
FROM auth.users u 
WHERE u.email = 'abdurrehman587@gmail.com';
