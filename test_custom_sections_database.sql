-- Test Custom Sections Database Setup
-- This script will help verify if the custom_sections column is properly set up

-- =====================================================
-- 1. CHECK IF COLUMN EXISTS
-- =====================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'cvs' 
  AND column_name = 'custom_sections';

-- =====================================================
-- 2. CHECK SAMPLE DATA
-- =====================================================

-- Check a few sample records to see the custom_sections data
SELECT 
  id,
  name,
  custom_sections,
  CASE 
    WHEN custom_sections IS NULL THEN 'NULL'
    WHEN custom_sections = '[]' THEN 'Empty Array'
    WHEN custom_sections = 'null' THEN 'String null'
    ELSE 'Has Data'
  END as custom_sections_status,
  pg_typeof(custom_sections) as data_type
FROM cvs 
LIMIT 5;

-- =====================================================
-- 3. CHECK FOR RECORDS WITH CUSTOM SECTIONS DATA
-- =====================================================

-- Find records that have actual custom sections data
SELECT 
  id,
  name,
  custom_sections,
  jsonb_array_length(custom_sections) as sections_count
FROM cvs 
WHERE custom_sections IS NOT NULL 
  AND custom_sections != '[]'::jsonb
  AND custom_sections != 'null'::jsonb
  AND jsonb_array_length(custom_sections) > 0
LIMIT 10;

-- =====================================================
-- 4. CHECK DATA TYPES AND STRUCTURE
-- =====================================================

-- Check the structure of custom sections data
SELECT 
  id,
  name,
  custom_sections,
  CASE 
    WHEN jsonb_typeof(custom_sections) = 'array' THEN 'Array'
    WHEN jsonb_typeof(custom_sections) = 'object' THEN 'Object'
    WHEN jsonb_typeof(custom_sections) = 'string' THEN 'String'
    WHEN jsonb_typeof(custom_sections) = 'number' THEN 'Number'
    WHEN jsonb_typeof(custom_sections) = 'boolean' THEN 'Boolean'
    WHEN jsonb_typeof(custom_sections) = 'null' THEN 'Null'
    ELSE 'Unknown'
  END as json_type
FROM cvs 
WHERE custom_sections IS NOT NULL
LIMIT 10;

-- =====================================================
-- 5. FIX COMMON ISSUES (if needed)
-- =====================================================

-- If you see issues, run these commands:

-- Fix NULL values to empty arrays
-- UPDATE cvs SET custom_sections = '[]'::jsonb WHERE custom_sections IS NULL;

-- Fix string 'null' values to empty arrays  
-- UPDATE cvs SET custom_sections = '[]'::jsonb WHERE custom_sections = 'null';

-- Fix empty string values to empty arrays
-- UPDATE cvs SET custom_sections = '[]'::jsonb WHERE custom_sections = '';

-- =====================================================
-- 6. VERIFY ADMIN RPC FUNCTION
-- =====================================================

-- Check if admin_update_cv function exists and has custom_sections parameter
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'admin_update_cv'
  AND routine_schema = 'public';

-- =====================================================
-- 7. TEST DATA INSERTION
-- =====================================================

-- Test inserting a record with custom sections (uncomment to test)
/*
INSERT INTO cvs (
  name, 
  phone, 
  email, 
  custom_sections,
  user_id
) VALUES (
  'Test User',
  '1234567890',
  'test@example.com',
  '[{"heading": "Test Section", "details": ["Test Detail 1", "Test Detail 2"]}]'::jsonb,
  NULL
) RETURNING id, name, custom_sections;
*/ 