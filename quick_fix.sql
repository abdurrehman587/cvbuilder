-- Quick Fix for Admin Panel Payment Loading Issue
-- This temporarily disables RLS to allow admin panel to work

-- Disable RLS temporarily for admin panel access
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE cv_downloads DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('payments', 'cv_downloads');

-- Note: This is a temporary fix. For production, you should implement proper admin authentication
-- and re-enable RLS with appropriate policies. 