-- Add custom_sections column to CV tables
-- Run this in Supabase SQL Editor

-- Add custom_sections column to user_cvs table
ALTER TABLE user_cvs 
ADD COLUMN IF NOT EXISTS custom_sections JSONB DEFAULT '[]';

-- Add custom_sections column to admin_cvs table
ALTER TABLE admin_cvs 
ADD COLUMN IF NOT EXISTS custom_sections JSONB DEFAULT '[]';

-- Update existing rows to have empty custom_sections array if they don't have it
UPDATE user_cvs 
SET custom_sections = '[]' 
WHERE custom_sections IS NULL;

UPDATE admin_cvs 
SET custom_sections = '[]' 
WHERE custom_sections IS NULL; 