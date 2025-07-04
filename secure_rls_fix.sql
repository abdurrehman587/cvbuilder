-- Secure RLS Policy Fix for Admin Panel
-- This provides a more secure approach than allowing all access

-- First, drop the overly permissive policy we created earlier
DROP POLICY IF EXISTS "Admin access to all payments" ON payments;
DROP POLICY IF EXISTS "Admin access to all downloads" ON cv_downloads;

-- Create a more secure admin policy that checks for admin email
CREATE POLICY "Secure admin access to payments" ON payments
    FOR ALL USING (
        -- Allow if user is authenticated and is admin
        (auth.uid() IS NOT NULL AND 
         EXISTS (
             SELECT 1 FROM auth.users 
             WHERE auth.users.id = auth.uid() 
             AND auth.users.email = 'admin@cvbuilder.com'
         ))
        OR
        -- Allow if user is authenticated and matches their own data
        (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    );

CREATE POLICY "Secure admin access to downloads" ON cv_downloads
    FOR ALL USING (
        -- Allow if user is authenticated and is admin
        (auth.uid() IS NOT NULL AND 
         EXISTS (
             SELECT 1 FROM auth.users 
             WHERE auth.users.id = auth.uid() 
             AND auth.users.email = 'admin@cvbuilder.com'
         ))
        OR
        -- Allow if user is authenticated and matches their own data
        (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    );

-- Alternative: If you want to disable RLS temporarily for admin panel testing
-- ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE cv_downloads DISABLE ROW LEVEL SECURITY; 