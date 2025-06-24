-- Add custom_sections column to the cvs table
-- This script adds support for the new "Add more Section" feature

-- Add the custom_sections column
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS custom_sections JSONB DEFAULT '[]'::jsonb;

-- Update existing records to have an empty custom_sections array
UPDATE cvs SET custom_sections = '[]'::jsonb WHERE custom_sections IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN cvs.custom_sections IS 'JSON array of custom sections with heading and details';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'cvs' AND column_name = 'custom_sections'; 