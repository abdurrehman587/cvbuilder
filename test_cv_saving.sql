-- Test CV Saving Functionality
-- Run this in Supabase SQL Editor to verify everything is working

-- 1. Check if tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_cvs', 'admin_cvs');

-- 2. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_cvs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check RLS policies
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
WHERE tablename = 'user_cvs';

-- 4. Test insert (this will fail if RLS is blocking)
-- Replace 'test@example.com' with your actual email
INSERT INTO user_cvs (
    user_email, 
    name, 
    email, 
    phone,
    objective,
    education,
    work_experience,
    skills,
    certifications,
    projects,
    languages,
    hobbies,
    cv_references,
    other_information
) VALUES (
    'test@example.com',
    'Test User',
    'test@example.com',
    '1234567890',
    '["Test objective"]',
    '[{"degree": "Test Degree", "institute": "Test Institute", "year": "2023"}]',
    '[{"company": "Test Company", "designation": "Test Role", "duration": "1 year", "details": "Test details"}]',
    '[{"name": "Test Skill", "percentage": "90%"}]',
    '["Test Certification"]',
    '["Test Project"]',
    '["English", "Spanish"]',
    '["Reading", "Writing"]',
    '["Test Reference"]',
    '[{"id": 1, "labelType": "checkbox", "label": "Test Info", "checked": true, "value": "Test Value", "name": "test", "radioValue": "", "isCustom": false}]'
);

-- 5. Check if insert worked
SELECT * FROM user_cvs WHERE user_email = 'test@example.com';

-- 6. Clean up test data
DELETE FROM user_cvs WHERE user_email = 'test@example.com';

-- 7. Verify cleanup
SELECT COUNT(*) as remaining_records FROM user_cvs WHERE user_email = 'test@example.com'; 