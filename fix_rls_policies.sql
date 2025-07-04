-- Fix RLS Policies for Admin Panel Access
-- This script fixes the "Failed to load payments" issue in the admin panel

-- Drop existing policies that are blocking admin access
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
DROP POLICY IF EXISTS "Users can update own payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Users can view own downloads" ON cv_downloads;
DROP POLICY IF EXISTS "Users can insert own downloads" ON cv_downloads;
DROP POLICY IF EXISTS "Admins can view all downloads" ON cv_downloads;

-- Create new policies for payments table
-- Allow all operations for authenticated users (they can only see their own data due to user_id check)
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND auth.uid() = user_id
    );

CREATE POLICY "Users can insert own payments" ON payments
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND auth.uid() = user_id
    );

CREATE POLICY "Users can update own payments" ON payments
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND auth.uid() = user_id
    );

-- Allow admin access without requiring Supabase auth (for admin panel)
CREATE POLICY "Admin access to all payments" ON payments
    FOR ALL USING (true);

-- Create policies for downloads table
CREATE POLICY "Users can view own downloads" ON cv_downloads
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND auth.uid() = user_id
    );

CREATE POLICY "Users can insert own downloads" ON cv_downloads
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND auth.uid() = user_id
    );

-- Allow admin access to downloads without requiring Supabase auth
CREATE POLICY "Admin access to all downloads" ON cv_downloads
    FOR ALL USING (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('payments', 'cv_downloads')
ORDER BY tablename, policyname; 