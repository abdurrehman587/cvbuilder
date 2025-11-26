-- Migration: Create orders table for marketplace
-- Run this in your Supabase SQL Editor

-- Step 1: Create orders table
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE, -- Sequential order number (01, 02, 03, etc.)
  user_id UUID REFERENCES auth.users(id),
  user_email VARCHAR(255),
  order_items JSONB NOT NULL, -- Array of cart items
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- 'bank_transfer' or 'cash_on_delivery'
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
  order_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Enable Row Level Security (RLS)
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS Policies
-- Note: If policies already exist, run fix-orders-policies.sql first to drop them

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own orders" ON public.marketplace_orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.marketplace_orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.marketplace_orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.marketplace_orders;

-- Allow users to view their own orders
CREATE POLICY "Users can view their own orders" ON public.marketplace_orders
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Allow users to create orders
CREATE POLICY "Users can create orders" ON public.marketplace_orders
  FOR INSERT WITH CHECK (true); -- Allow anyone to create orders (for guest checkout)

-- Allow admins to view all orders
CREATE POLICY "Admins can view all orders" ON public.marketplace_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Allow admins to update orders
CREATE POLICY "Admins can update orders" ON public.marketplace_orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Step 4: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketplace_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger for updated_at
DROP TRIGGER IF EXISTS update_marketplace_orders_updated_at ON public.marketplace_orders;

CREATE TRIGGER update_marketplace_orders_updated_at
  BEFORE UPDATE ON public.marketplace_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_orders_updated_at();

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_user_id 
  ON public.marketplace_orders(user_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_created_at 
  ON public.marketplace_orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_payment_status 
  ON public.marketplace_orders(payment_status);

CREATE INDEX IF NOT EXISTS idx_marketplace_orders_order_status 
  ON public.marketplace_orders(order_status);

-- Step 7: Create sequence for sequential order numbers
CREATE SEQUENCE IF NOT EXISTS marketplace_order_number_seq
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;

-- Step 8: Create function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  order_num TEXT;
BEGIN
  -- Get next number from sequence
  next_num := nextval('marketplace_order_number_seq');
  
  -- Format as zero-padded string (e.g., 01, 02, 03, ..., 10, 11, etc.)
  order_num := LPAD(next_num::TEXT, 2, '0');
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger to auto-generate order number on insert
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_set_order_number ON public.marketplace_orders;

-- Create trigger
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON public.marketplace_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Step 10: Create index on order_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_order_number 
  ON public.marketplace_orders(order_number);

