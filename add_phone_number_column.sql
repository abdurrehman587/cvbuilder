-- Add phone_number column to payments table if it doesn't exist
DO $$ 
BEGIN
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
END $$; 