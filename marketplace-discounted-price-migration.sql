-- Migration: Add support for discounted prices (original_price field)
-- Run this in your Supabase SQL Editor

-- Step 1: Add original_price column to marketplace_products table
ALTER TABLE public.marketplace_products 
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2);

-- Step 2: Optional - Set original_price for existing products that might have discounts
-- This is optional and can be customized based on your needs
-- UPDATE public.marketplace_products
-- SET original_price = price
-- WHERE original_price IS NULL;

-- Verify the migration
SELECT 
  id,
  name,
  price,
  original_price,
  CASE 
    WHEN original_price IS NOT NULL AND original_price > price THEN 
      ROUND(((original_price - price) / original_price * 100)::numeric, 0)
    ELSE NULL
  END as discount_percentage
FROM public.marketplace_products
LIMIT 10;

