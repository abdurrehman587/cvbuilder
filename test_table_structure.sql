-- Test script to check table structure and permissions

-- 1. Check if the table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'cvs';

-- 2. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'cvs'
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'cvs';

-- 4. Check permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'cvs';

-- 5. Test insert with sample data (run this as authenticated user)
-- INSERT INTO cvs (user_id, name, phone, email) 
-- VALUES (auth.uid(), 'Test User', '1234567890', 'test@example.com')
-- ON CONFLICT (user_id) DO UPDATE SET 
-- name = EXCLUDED.name, 
-- phone = EXCLUDED.phone, 
-- email = EXCLUDED.email; 