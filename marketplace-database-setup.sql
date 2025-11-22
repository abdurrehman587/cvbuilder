-- Marketplace Database Setup Script
-- Run this in your Supabase SQL Editor

-- Step 1: Create marketplace_sections table
CREATE TABLE IF NOT EXISTS public.marketplace_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create marketplace_products table
CREATE TABLE IF NOT EXISTS public.marketplace_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  section_id UUID REFERENCES public.marketplace_sections(id) ON DELETE CASCADE,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE public.marketplace_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies for marketplace_sections
-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view sections" ON public.marketplace_sections;
DROP POLICY IF EXISTS "Admins can insert sections" ON public.marketplace_sections;
DROP POLICY IF EXISTS "Admins can update sections" ON public.marketplace_sections;
DROP POLICY IF EXISTS "Admins can delete sections" ON public.marketplace_sections;

-- Allow everyone to read sections
CREATE POLICY "Anyone can view sections" ON public.marketplace_sections
  FOR SELECT USING (true);

-- Allow admins to insert sections
CREATE POLICY "Admins can insert sections" ON public.marketplace_sections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Allow admins to update sections
CREATE POLICY "Admins can update sections" ON public.marketplace_sections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Allow admins to delete sections
CREATE POLICY "Admins can delete sections" ON public.marketplace_sections
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Step 5: Create RLS Policies for marketplace_products
-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can update products" ON public.marketplace_products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.marketplace_products;

-- Allow everyone to read products
CREATE POLICY "Anyone can view products" ON public.marketplace_products
  FOR SELECT USING (true);

-- Allow admins to insert products
CREATE POLICY "Admins can insert products" ON public.marketplace_products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Allow admins to update products
CREATE POLICY "Admins can update products" ON public.marketplace_products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Allow admins to delete products
CREATE POLICY "Admins can delete products" ON public.marketplace_products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Step 6: Create storage bucket for marketplace images
-- Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketplace-images', 'marketplace-images', true)
ON CONFLICT (id) DO NOTHING;

-- Step 6a: Create RLS policies for marketplace-images storage bucket
-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete marketplace images" ON storage.objects;

-- Allow everyone to view images (public bucket)
CREATE POLICY "Anyone can view marketplace images" ON storage.objects
  FOR SELECT USING (bucket_id = 'marketplace-images');

-- Allow admins to upload images
CREATE POLICY "Admins can upload marketplace images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'marketplace-images' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Allow admins to update images
CREATE POLICY "Admins can update marketplace images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'marketplace-images' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Allow admins to delete images
CREATE POLICY "Admins can delete marketplace images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'marketplace-images' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Step 7: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create triggers to auto-update updated_at
-- Drop existing triggers if they exist (to avoid conflicts)
DROP TRIGGER IF EXISTS update_marketplace_sections_updated_at ON public.marketplace_sections;
DROP TRIGGER IF EXISTS update_marketplace_products_updated_at ON public.marketplace_products;

CREATE TRIGGER update_marketplace_sections_updated_at
  BEFORE UPDATE ON public.marketplace_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_products_updated_at
  BEFORE UPDATE ON public.marketplace_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketplace_products_section_id 
  ON public.marketplace_products(section_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_sections_display_order 
  ON public.marketplace_sections(display_order);

-- Step 10: Insert sample data (optional)
-- Uncomment and modify as needed
/*
INSERT INTO public.marketplace_sections (name, display_order) VALUES
  ('Mobile Accessories', 1),
  ('Computer Accessories', 2),
  ('Cards', 3);
*/

