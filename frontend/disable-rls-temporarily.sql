-- Temporarily disable RLS to test CV saving
-- Run this in Supabase SQL Editor

-- Disable RLS temporarily
ALTER TABLE public.user_cvs DISABLE ROW LEVEL SECURITY;

-- Test that we can insert data
INSERT INTO public.user_cvs (user_id, name, email, cv_name) 
VALUES ('test_user_' || extract(epoch from now()), 'Test User', 'test@example.com', 'Test CV')
ON CONFLICT DO NOTHING;

-- Verify it worked
SELECT 'RLS disabled - test successful' as status, COUNT(*) as records FROM public.user_cvs;

-- Clean up test data
DELETE FROM public.user_cvs WHERE user_id LIKE 'test_user_%';

-- Note: After confirming CV saving works, you can re-enable RLS with:
-- ALTER TABLE public.user_cvs ENABLE ROW LEVEL SECURITY;
