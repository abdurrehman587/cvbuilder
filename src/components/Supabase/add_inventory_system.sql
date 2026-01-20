-- Add inventory/stock management system to marketplace_products
-- Run this SQL in Supabase SQL Editor

-- Step 1: Add stock column to marketplace_products table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_products' 
        AND column_name = 'stock'
    ) THEN
        ALTER TABLE public.marketplace_products 
        ADD COLUMN stock INTEGER DEFAULT 1 NOT NULL;
        
        -- Add comment to column
        COMMENT ON COLUMN public.marketplace_products.stock IS 'Available stock quantity for the product. Default is 1.';
        
        -- Create index for better query performance
        CREATE INDEX IF NOT EXISTS idx_marketplace_products_stock 
        ON public.marketplace_products(stock) 
        WHERE stock > 0;
    END IF;
END $$;

-- Step 2: Set default stock of 1 for all existing products that don't have stock set
UPDATE public.marketplace_products
SET stock = 1
WHERE stock IS NULL OR stock < 1;

-- Step 3: Add constraint to ensure stock is never negative
ALTER TABLE public.marketplace_products
DROP CONSTRAINT IF EXISTS check_stock_non_negative;

ALTER TABLE public.marketplace_products
ADD CONSTRAINT check_stock_non_negative 
CHECK (stock >= 0);

-- Step 4: Verify the changes
SELECT 
    id,
    name,
    stock,
    shopkeeper_id,
    CASE 
        WHEN stock IS NULL THEN '⚠️ Stock is NULL'
        WHEN stock < 0 THEN '❌ Stock is negative'
        WHEN stock = 0 THEN '⚠️ Out of stock'
        WHEN stock > 0 AND stock <= 5 THEN '⚠️ Low stock'
        ELSE '✅ In stock'
    END as stock_status
FROM public.marketplace_products
ORDER BY stock ASC, name
LIMIT 20;
