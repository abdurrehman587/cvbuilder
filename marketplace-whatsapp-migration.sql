-- Migration to add has_whatsapp column to marketplace_orders table
-- Run this in your Supabase SQL Editor

-- Add has_whatsapp column to marketplace_orders table
ALTER TABLE marketplace_orders 
ADD COLUMN IF NOT EXISTS has_whatsapp BOOLEAN DEFAULT false;

-- Update existing orders to set has_whatsapp to false
UPDATE marketplace_orders 
SET has_whatsapp = false 
WHERE has_whatsapp IS NULL;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'marketplace_orders' AND column_name = 'has_whatsapp';

