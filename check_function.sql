-- Check if the admin_update_cv function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%admin%' OR routine_name LIKE '%cv%';

-- List all functions in the public schema
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Check function parameters
SELECT 
    p.parameter_name,
    p.data_type,
    p.parameter_default
FROM information_schema.parameters p
JOIN information_schema.routines r ON p.specific_name = r.specific_name
WHERE r.routine_schema = 'public' 
AND r.routine_name = 'admin_update_cv'
ORDER BY p.ordinal_position; 