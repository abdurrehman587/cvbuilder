-- Simple fix for RLS policy violation on INSERT
-- This allows anyone (including anonymous/guest users) to create orders
-- Run this in your Supabase SQL Editor

-- Step 1: Ensure RLS is enabled
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can create orders" ON public.marketplace_orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.marketplace_orders;
DROP POLICY IF EXISTS "Public can create orders" ON public.marketplace_orders;

-- Step 3: Create a new INSERT policy that explicitly allows anyone to create orders
-- Using TO public ensures both authenticated and anonymous users can insert
CREATE POLICY "Public can create orders" ON public.marketplace_orders
  FOR INSERT 
  TO public
  WITH CHECK (true);

-- Note: 
-- - TO public means this policy applies to all users (authenticated and anonymous)
-- - WITH CHECK (true) means "allow any insert operation"
-- - This is necessary for guest checkout functionality

