-- Add location tracking system to users table
-- Run this SQL in Supabase SQL Editor

-- Step 1: Add location columns to public.users table
DO $$ 
BEGIN
    -- Add latitude column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'latitude'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN latitude DECIMAL(10, 8);
        
        COMMENT ON COLUMN public.users.latitude IS 'User location latitude coordinate.';
    END IF;
    
    -- Add longitude column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'longitude'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN longitude DECIMAL(11, 8);
        
        COMMENT ON COLUMN public.users.longitude IS 'User location longitude coordinate.';
    END IF;
    
    -- Add address column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'address'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN address TEXT;
        
        COMMENT ON COLUMN public.users.address IS 'User physical address or location description.';
    END IF;
    
    -- Add city column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'city'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN city TEXT;
        
        COMMENT ON COLUMN public.users.city IS 'User city name.';
    END IF;
    
    -- Add location_updated_at column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'location_updated_at'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN location_updated_at TIMESTAMP WITH TIME ZONE;
        
        COMMENT ON COLUMN public.users.location_updated_at IS 'Timestamp when location was last updated.';
    END IF;
END $$;

-- Step 2: Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_users_location 
ON public.users(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Step 3: Create index for city-based queries
CREATE INDEX IF NOT EXISTS idx_users_city 
ON public.users(city) 
WHERE city IS NOT NULL;

-- Step 4: Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN ('latitude', 'longitude', 'address', 'city', 'location_updated_at')
ORDER BY column_name;
