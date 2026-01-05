-- Add is_hidden column to marketplace_products table
-- This allows admins to hide products from customers without deleting them

-- Add is_hidden column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_products' 
        AND column_name = 'is_hidden'
    ) THEN
        ALTER TABLE public.marketplace_products 
        ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE;
        
        -- Add comment to column
        COMMENT ON COLUMN public.marketplace_products.is_hidden IS 'If true, product is hidden from public view but visible in admin panel';
    END IF;
END $$;

-- Create index for better query performance when filtering hidden products
CREATE INDEX IF NOT EXISTS idx_marketplace_products_is_hidden 
ON public.marketplace_products(is_hidden) 
WHERE is_hidden = FALSE;

-- Update existing products to have is_hidden = FALSE (if NULL)
UPDATE public.marketplace_products 
SET is_hidden = FALSE 
WHERE is_hidden IS NULL;

