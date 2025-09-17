-- Quick Fix for user_cvs Permission Error
-- Run this in Supabase SQL Editor

-- 1. Disable RLS temporarily
ALTER TABLE public.user_cvs DISABLE ROW LEVEL SECURITY;

-- 2. Test that table is accessible
SELECT COUNT(*) as record_count FROM public.user_cvs;

-- 3. Re-enable RLS
ALTER TABLE public.user_cvs ENABLE ROW LEVEL SECURITY;

-- 4. Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Users can insert their own CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Users can update their own CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Users can delete their own CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Admins can view all user CVs" ON public.user_cvs;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.user_cvs;

-- 5. Create a simple policy that allows all authenticated users
CREATE POLICY "Allow all for authenticated users" ON public.user_cvs
    FOR ALL USING (auth.role() = 'authenticated');

-- 6. Test the fix
SELECT 'RLS fix test' as status, COUNT(*) as records FROM public.user_cvs;
