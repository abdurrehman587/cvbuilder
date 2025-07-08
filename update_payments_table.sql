-- Update payments table to ensure all required columns exist
DO $$ 
BEGIN
    -- Add phone_number column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'phone_number'
    ) THEN
        ALTER TABLE payments ADD COLUMN phone_number TEXT;
        RAISE NOTICE 'Added phone_number column to payments table';
    ELSE
        RAISE NOTICE 'phone_number column already exists in payments table';
    END IF;

    -- Add payment_method column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE payments ADD COLUMN payment_method TEXT;
        RAISE NOTICE 'Added payment_method column to payments table';
    ELSE
        RAISE NOTICE 'payment_method column already exists in payments table';
    END IF;

    -- Add template_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'template_id'
    ) THEN
        ALTER TABLE payments ADD COLUMN template_id TEXT;
        RAISE NOTICE 'Added template_id column to payments table';
    ELSE
        RAISE NOTICE 'template_id column already exists in payments table';
    END IF;

    -- Add user_email column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'user_email'
    ) THEN
        ALTER TABLE payments ADD COLUMN user_email TEXT;
        RAISE NOTICE 'Added user_email column to payments table';
    ELSE
        RAISE NOTICE 'user_email column already exists in payments table';
    END IF;

    -- Add amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'amount'
    ) THEN
        ALTER TABLE payments ADD COLUMN amount DECIMAL(10,2);
        RAISE NOTICE 'Added amount column to payments table';
    ELSE
        RAISE NOTICE 'amount column already exists in payments table';
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE payments ADD COLUMN status TEXT DEFAULT 'pending';
        RAISE NOTICE 'Added status column to payments table';
    ELSE
        RAISE NOTICE 'status column already exists in payments table';
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE payments ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to payments table';
    ELSE
        RAISE NOTICE 'created_at column already exists in payments table';
    END IF;

END $$; 