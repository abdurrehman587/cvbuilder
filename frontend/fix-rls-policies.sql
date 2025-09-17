-- Fix RLS Policies for user_cvs table
-- This script addresses the "permission denied for table users" error

-- Step 1: Check if the table exists and is accessible
SELECT 
    table_name, 
    is_insertable_into,
    is_updatable,
    is_trigger_updatable
FROM information_schema.tables 
WHERE table_name = 'user_cvs' 
AND table_schema = 'public';

-- Step 2: Check current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE tablename = 'user_cvs' 
AND schemaname = 'public';

-- Step 3: Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_cvs' 
AND schemaname = 'public';

-- Step 4: Drop all existing policies (to start fresh)
DROP POLICY IF EXISTS "Users can view their own CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Users can insert their own CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Users can update their own CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Users can delete their own CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Admins can view all user CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.user_cvs;
DROP POLICY IF EXISTS "Allow all operations" ON public.user_cvs;

-- Step 5: Temporarily disable RLS for testing
ALTER TABLE public.user_cvs DISABLE ROW LEVEL SECURITY;

-- Step 6: Test table access (this should work now)
SELECT 'Table access test' as test, COUNT(*) as record_count FROM public.user_cvs;

-- Step 7: Re-enable RLS
ALTER TABLE public.user_cvs ENABLE ROW LEVEL SECURITY;

-- Step 8: Create a simple, permissive policy for testing
CREATE POLICY "Allow all for authenticated users" ON public.user_cvs
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 9: Test with RLS enabled
SELECT 'RLS test' as test, COUNT(*) as record_count FROM public.user_cvs;

-- Step 10: If the above works, create more specific policies
-- (Uncomment these if the simple policy works)

-- CREATE POLICY "Users can view their own CVs" ON public.user_cvs
--     FOR SELECT USING (user_id = auth.uid()::text);

-- CREATE POLICY "Users can insert their own CVs" ON public.user_cvs
--     FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- CREATE POLICY "Users can update their own CVs" ON public.user_cvs
--     FOR UPDATE USING (user_id = auth.uid()::text);

-- CREATE POLICY "Users can delete their own CVs" ON public.user_cvs
--     FOR DELETE USING (user_id = auth.uid()::text);

-- Step 11: Verify the fix
SELECT 
    'Final verification' as test,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users
FROM public.user_cvs;
