-- Migration: Add sequential order number to marketplace_orders table
-- Run this AFTER the initial marketplace-orders-migration.sql

-- Step 1: Add order_number column
ALTER TABLE public.marketplace_orders
ADD COLUMN IF NOT EXISTS order_number VARCHAR(20) UNIQUE;

-- Step 2: Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS marketplace_order_number_seq
START WITH 1
INCREMENT BY 1
NO MINVALUE
NO MAXVALUE
CACHE 1;

-- Step 3: Create function to generate order number
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

-- Step 4: Create trigger to auto-generate order number on insert
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

-- Step 5: Create index on order_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_order_number 
  ON public.marketplace_orders(order_number);

-- Step 6: Update existing orders (if any) with sequential numbers
-- This will assign order numbers to any existing orders
DO $$
DECLARE
  order_rec RECORD;
  counter INTEGER := 1;
BEGIN
  FOR order_rec IN 
    SELECT id FROM public.marketplace_orders 
    WHERE order_number IS NULL OR order_number = ''
    ORDER BY created_at ASC
  LOOP
    UPDATE public.marketplace_orders
    SET order_number = LPAD(counter::TEXT, 2, '0')
    WHERE id = order_rec.id;
    
    -- Update sequence to match
    PERFORM setval('marketplace_order_number_seq', counter, false);
    
    counter := counter + 1;
  END LOOP;
  
  -- Set sequence to continue from the highest number
  IF counter > 1 THEN
    PERFORM setval('marketplace_order_number_seq', counter - 1, true);
  END IF;
END $$;

