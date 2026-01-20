-- Add shop_name field to users table for shopkeepers
-- Run this SQL in Supabase SQL Editor

-- Step 1: Add shop_name column to public.users table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'shop_name'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN shop_name TEXT;
        
        -- Add comment to column
        COMMENT ON COLUMN public.users.shop_name IS 'Shop name for shopkeeper users. NULL for regular users and admins.';
        
        -- Create index for better query performance
        CREATE INDEX IF NOT EXISTS idx_users_shop_name 
        ON public.users(shop_name) 
        WHERE shop_name IS NOT NULL;
    END IF;
END $$;

-- Step 2: Update existing shopkeepers to have a default shop name if they don't have one
-- This is optional - you can manually set shop names for existing shopkeepers
UPDATE public.users u
SET shop_name = COALESCE(
    u.shop_name,
    COALESCE(u.full_name, 'My Shop') || '''s Shop'
)
WHERE EXISTS (
    SELECT 1 
    FROM auth.users au 
    WHERE au.id = u.id 
    AND (au.raw_user_meta_data->>'user_type')::text = 'shopkeeper'
)
AND u.shop_name IS NULL;

-- Step 3: Verify the changes
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.shop_name,
    (au.raw_user_meta_data->>'user_type')::text as user_type,
    CASE 
        WHEN (au.raw_user_meta_data->>'user_type')::text = 'shopkeeper' AND u.shop_name IS NOT NULL THEN '✅ Shopkeeper with shop name'
        WHEN (au.raw_user_meta_data->>'user_type')::text = 'shopkeeper' AND u.shop_name IS NULL THEN '⚠️ Shopkeeper without shop name'
        WHEN u.is_admin = true THEN '✅ Admin (no shop name needed)'
        ELSE '✅ Regular user (no shop name needed)'
    END as status
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE (au.raw_user_meta_data->>'user_type')::text = 'shopkeeper' 
   OR u.is_admin = true
ORDER BY u.is_admin DESC, u.shop_name;
