-- Simple Fix for RLS Policies - user_cvs table
-- This addresses the "permission denied for table users" error

-- Step 1: Check if table exists
SELECT 
    table_name, 
    table_type
FROM information_schema.tables 
WHERE table_name = 'user_cvs' 
AND table_schema = 'public';

-- Step 2: Check current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'user_cvs' 
AND schemaname = 'public';

-- Step 3: Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Users can insert their own CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Users can update their own CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Users can delete their own CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Admins can view all user CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.user_cvs;
DROP POLICY IF EXISTS "Allow all operations" ON public.user_cvs;

-- Step 4: Temporarily disable RLS for testing
ALTER TABLE public.user_cvs DISABLE ROW LEVEL SECURITY;

-- Step 5: Test table access (should work now)
SELECT 'Table access test - should work' as test, COUNT(*) as record_count FROM public.user_cvs;

-- Step 6: Re-enable RLS
ALTER TABLE public.user_cvs ENABLE ROW LEVEL SECURITY;

-- Step 7: Create a simple, permissive policy
CREATE POLICY "Allow all for authenticated users" ON public.user_cvs
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 8: Test with RLS enabled
SELECT 'RLS test - should work now' as test, COUNT(*) as record_count FROM public.user_cvs;

-- Step 9: Insert a test record to verify everything works
INSERT INTO public.user_cvs (user_id, name, email, cv_name) 
VALUES ('test_user_' || extract(epoch from now()), 'Test User', 'test@example.com', 'Test CV')
ON CONFLICT DO NOTHING;

-- Step 10: Verify the test record was inserted
SELECT 'Final verification' as test, COUNT(*) as total_records FROM public.user_cvs;
