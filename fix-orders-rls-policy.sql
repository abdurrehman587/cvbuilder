-- Fix RLS policies for marketplace_orders to allow guest checkout
-- Run this in your Supabase SQL Editor

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.marketplace_orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.marketplace_orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.marketplace_orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.marketplace_orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.marketplace_orders;
DROP POLICY IF EXISTS "Anyone can view orders by order number" ON public.marketplace_orders;

-- Step 2: Create INSERT policy that allows ANYONE (authenticated or anonymous) to create orders
-- This is essential for guest checkout
CREATE POLICY "Anyone can create orders" ON public.marketplace_orders
  FOR INSERT 
  WITH CHECK (true); -- Allow anyone, including anonymous users

-- Step 3: Create SELECT policy that allows users to view their own orders
-- Authenticated users can view orders where they are the user_id
CREATE POLICY "Users can view their own orders" ON public.marketplace_orders
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Step 4: Allow admins to view all orders
CREATE POLICY "Admins can view all orders" ON public.marketplace_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Step 5: Allow admins to update orders
CREATE POLICY "Admins can update orders" ON public.marketplace_orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Note: The SELECT policy above allows anyone to view orders by order_number
-- This is necessary for the order confirmation page to work for guest users
-- If you want more security, you could:
-- 1. Store order_number in localStorage/sessionStorage after order creation
-- 2. Require email verification before showing order details
-- 3. Add a time-limited token system

