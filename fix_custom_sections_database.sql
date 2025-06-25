-- Fix Custom Sections Database Issue
-- This script ensures the custom_sections column exists and has proper data

-- =====================================================
-- 1. ADD CUSTOM_SECTIONS COLUMN IF NOT EXISTS
-- =====================================================

-- Add custom_sections column if it doesn't exist
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS custom_sections JSONB DEFAULT '[]'::jsonb;

-- Update existing records to have an empty custom_sections array if NULL
UPDATE cvs SET custom_sections = '[]'::jsonb WHERE custom_sections IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN cvs.custom_sections IS 'JSON array of custom sections with heading and details';

-- =====================================================
-- 2. VERIFY COLUMN EXISTS AND HAS PROPER DATA
-- =====================================================

-- Check if the column was added successfully
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'cvs' AND column_name = 'custom_sections';

-- Check for any records with NULL custom_sections
SELECT COUNT(*) as null_custom_sections_count 
FROM cvs 
WHERE custom_sections IS NULL;

-- Check for any records with invalid JSON in custom_sections
SELECT COUNT(*) as invalid_json_count 
FROM cvs 
WHERE custom_sections IS NOT NULL 
AND jsonb_typeof(custom_sections) != 'array';

-- =====================================================
-- 3. FIX ANY INVALID DATA
-- =====================================================

-- Fix any records with invalid JSON by setting them to empty array
UPDATE cvs 
SET custom_sections = '[]'::jsonb 
WHERE custom_sections IS NOT NULL 
AND jsonb_typeof(custom_sections) != 'array';

-- =====================================================
-- 4. VERIFY FIXES
-- =====================================================

-- Final verification - all records should have valid JSONB arrays
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN custom_sections IS NULL THEN 1 END) as null_records,
  COUNT(CASE WHEN jsonb_typeof(custom_sections) = 'array' THEN 1 END) as valid_array_records,
  COUNT(CASE WHEN jsonb_typeof(custom_sections) != 'array' THEN 1 END) as invalid_records
FROM cvs;

-- Show sample of custom_sections data
SELECT 
  id, 
  name, 
  custom_sections,
  jsonb_typeof(custom_sections) as data_type
FROM cvs 
LIMIT 5; 