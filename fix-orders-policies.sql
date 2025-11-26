-- Quick fix: Drop and recreate policies safely
-- Run this if you get "policy already exists" error

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.marketplace_orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.marketplace_orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.marketplace_orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.marketplace_orders;

-- Recreate policies
CREATE POLICY "Users can view their own orders" ON public.marketplace_orders
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Users can create orders" ON public.marketplace_orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all orders" ON public.marketplace_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update orders" ON public.marketplace_orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

