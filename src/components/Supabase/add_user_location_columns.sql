-- Add location columns to users table if they don't exist
-- This migration is idempotent and can be run multiple times safely

DO $$ 
BEGIN
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
        
        COMMENT ON COLUMN public.users.address IS 'User address from geocoding';
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
        
        COMMENT ON COLUMN public.users.city IS 'User city from geocoding';
    END IF;

    -- Add latitude column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'latitude'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN latitude NUMERIC;
        
        COMMENT ON COLUMN public.users.latitude IS 'User latitude coordinate';
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
        ADD COLUMN longitude NUMERIC;
        
        COMMENT ON COLUMN public.users.longitude IS 'User longitude coordinate';
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
        ADD COLUMN location_updated_at TIMESTAMPTZ;
        
        COMMENT ON COLUMN public.users.location_updated_at IS 'Timestamp when location was last updated';
    END IF;

    -- Create index on location columns for better query performance
    CREATE INDEX IF NOT EXISTS idx_users_location_coords 
    ON public.users(latitude, longitude) 
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

    -- Create index on city for location-based queries
    CREATE INDEX IF NOT EXISTS idx_users_city 
    ON public.users(city) 
    WHERE city IS NOT NULL;

END $$;
