-- Migration: Add support for multiple images per product
-- Run this in your Supabase SQL Editor

-- Step 1: Add image_urls column (JSONB) to store array of image URLs
ALTER TABLE public.marketplace_products 
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

-- Step 2: Migrate existing image_url data to image_urls array
-- This will move single image_url to image_urls array for backward compatibility
UPDATE public.marketplace_products
SET image_urls = CASE 
  WHEN image_url IS NOT NULL AND image_url != '' THEN jsonb_build_array(image_url)
  ELSE '[]'::jsonb
END
WHERE image_urls IS NULL OR image_urls = '[]'::jsonb;

-- Step 3: Keep image_url column for backward compatibility (optional - you can drop it later)
-- For now, we'll keep both columns. image_urls will be the primary one going forward.

-- Verify the migration
SELECT 
  id,
  name,
  image_url,
  image_urls,
  jsonb_array_length(image_urls) as image_count
FROM public.marketplace_products
LIMIT 10;

