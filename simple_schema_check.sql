-- Simple check of cvs table columns
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'cvs'
ORDER BY ordinal_position; 