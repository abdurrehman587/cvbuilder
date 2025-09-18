-- Create user account for abdurrehman587@gmail.com
-- Run this in Supabase SQL Editor

-- Create user account in Supabase Auth
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

-- Verify the user was created
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'role' as role,
    u.raw_user_meta_data->>'name' as name,
    u.created_at
FROM auth.users u 
WHERE u.email = 'abdurrehman587@gmail.com';
