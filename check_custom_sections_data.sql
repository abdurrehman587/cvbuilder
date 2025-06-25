-- Check current custom sections data in the database
SELECT 
    id,
    name,
    custom_sections,
    other_information,
    updated_at
FROM cvs 
WHERE custom_sections IS NOT NULL 
   OR other_information IS NOT NULL
ORDER BY updated_at DESC
LIMIT 5;

-- Check the structure of custom_sections column
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'cvs' 
AND column_name IN ('custom_sections', 'other_information');

-- Test JSONB conversion
SELECT 
    '[]'::jsonb as empty_array,
    'null'::jsonb as null_json,
    '{"test": "value"}'::jsonb as test_json; 