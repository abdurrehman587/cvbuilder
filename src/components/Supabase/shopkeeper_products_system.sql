-- Shopkeeper Products System
-- Run this SQL in Supabase SQL Editor

-- Add shopkeeper_id column to marketplace_products table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_products' 
        AND column_name = 'shopkeeper_id'
    ) THEN
        ALTER TABLE public.marketplace_products 
        ADD COLUMN shopkeeper_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
        
        -- Add comment to column
        COMMENT ON COLUMN public.marketplace_products.shopkeeper_id IS 'ID of the shopkeeper who created this product. NULL means created by admin.';
        
        -- Create index for better query performance
        CREATE INDEX IF NOT EXISTS idx_marketplace_products_shopkeeper_id 
        ON public.marketplace_products(shopkeeper_id);
    END IF;
END $$;

-- Enable RLS on marketplace_products if not already enabled
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Shopkeepers can view their own products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Shopkeepers can insert their own products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Shopkeepers can update their own products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Shopkeepers can delete their own products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Public can view non-hidden products" ON public.marketplace_products;

-- Policy: Shopkeepers can view their own products (including hidden ones)
CREATE POLICY "Shopkeepers can view their own products" ON public.marketplace_products
  FOR SELECT USING (
    shopkeeper_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'user_type')::text = 'shopkeeper'
    )
  );

-- Policy: Shopkeepers can insert their own products
CREATE POLICY "Shopkeepers can insert their own products" ON public.marketplace_products
  FOR INSERT WITH CHECK (
    shopkeeper_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'user_type')::text = 'shopkeeper'
    )
  );

-- Policy: Shopkeepers can update their own products
CREATE POLICY "Shopkeepers can update their own products" ON public.marketplace_products
  FOR UPDATE USING (
    shopkeeper_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'user_type')::text = 'shopkeeper'
    )
  );

-- Policy: Shopkeepers can delete their own products
CREATE POLICY "Shopkeepers can delete their own products" ON public.marketplace_products
  FOR DELETE USING (
    shopkeeper_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'user_type')::text = 'shopkeeper'
    )
  );

-- Policy: Public can view non-hidden products (this should already exist, but ensure it works with shopkeeper products)
-- Note: This policy allows everyone (including shopkeepers) to view products that are not hidden
-- Shopkeepers' products will be visible to everyone unless is_hidden = true
