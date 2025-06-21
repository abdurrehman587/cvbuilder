-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'cvs'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'cvs'; 

-- Test insert (replace with your actual user ID)
INSERT INTO cvs (user_id, name, phone, email) 
VALUES ('c9d22ec6-2e23-4740-abda-2d7f2f02854e', 'Test User', '1234567890', 'test@example.com')
ON CONFLICT (user_id) DO UPDATE SET 
name = EXCLUDED.name, 
phone = EXCLUDED.phone, 
email = EXCLUDED.email; 