-- Test the admin_update_cv function to see if it can update custom sections
-- This will help us verify if the function is working correctly

-- First, let's see the current state
SELECT 
    id,
    name,
    custom_sections,
    updated_at
FROM cvs 
WHERE name = 'Jahangir Khan'
ORDER BY updated_at DESC
LIMIT 1;

-- Now test the function with custom sections data
SELECT admin_update_cv(
    32, -- p_cv_id (Jahangir Khan CV)
    'Jahangir Khan', -- p_name
    '1234567890', -- p_phone
    'test@example.com', -- p_email
    'Test Address', -- p_address
    '[]', -- p_objective
    '[]', -- p_education
    '[]', -- p_work_experience
    '[]', -- p_skills
    '[]', -- p_certifications
    '[]', -- p_projects
    '[]', -- p_languages
    '[]', -- p_hobbies
    '[]', -- p_references
    '[{"id": 1, "title": "Updated Military Qualification", "items": ["Updated Course 1", "Updated Course 2", "Updated Course 3"]}]', -- p_custom_sections
    '[]', -- p_other_information
    null -- p_image_url
);

-- Check if the update worked
SELECT 
    id,
    name,
    custom_sections,
    updated_at
FROM cvs 
WHERE id = 32;

-- Test script to check admin_update_cv function
-- This will help us understand why the RPC function is failing

-- 1. Check if the function exists
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    p.prosecdef as security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'admin_update_cv' AND n.nspname = 'public';

-- 2. Check function permissions
SELECT 
    p.proname as function_name,
    r.rolname as role_name,
    has_function_privilege(r.oid, p.oid, 'EXECUTE') as can_execute
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_roles r ON r.rolname IN ('authenticated', 'anon', 'postgres')
WHERE p.proname = 'admin_update_cv' AND n.nspname = 'public';

-- 3. Check RLS policies on cvs table
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
WHERE tablename = 'cvs';

-- 4. Test the function with a simple call (this will fail if there are issues)
-- SELECT admin_update_cv(
--     NULL, -- p_cv_id
--     'Test Name', -- p_name
--     '1234567890', -- p_phone
--     'test@example.com', -- p_email
--     'Test Address', -- p_address
--     '[]', -- p_objective
--     '[]', -- p_education
--     '[]', -- p_work_experience
--     '[]', -- p_skills
--     '[]', -- p_certifications
--     '[]', -- p_projects
--     '[]', -- p_languages
--     '[]', -- p_hobbies
--     '[]', -- p_references
--     '[]', -- p_custom_sections
--     '[]', -- p_other_information
--     NULL -- p_image_url
-- ); 