-- Update database schema to support admin CV functionality
-- Run this script in your Supabase SQL editor

-- Make name and phone NOT NULL
ALTER TABLE cvs ALTER COLUMN name SET NOT NULL;
ALTER TABLE cvs ALTER COLUMN phone SET NOT NULL;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_cvs_name ON cvs(name);
CREATE INDEX IF NOT EXISTS idx_cvs_phone ON cvs(phone);

-- Create unique constraint for name and phone combination (for admin CVs)
-- This allows admin CVs to be uniquely identified by name and phone
CREATE UNIQUE INDEX IF NOT EXISTS idx_cvs_name_phone_unique ON cvs(name, phone) WHERE user_id IS NULL;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can view all CVs" ON cvs;
DROP POLICY IF EXISTS "Admin can insert CVs" ON cvs;
DROP POLICY IF EXISTS "Admin can update CVs" ON cvs;
DROP POLICY IF EXISTS "Admin can delete CVs" ON cvs;

-- Create policies for admin access (admin CVs have user_id = NULL)
CREATE POLICY "Admin can view all CVs" ON cvs
  FOR SELECT USING (user_id IS NULL);

CREATE POLICY "Admin can insert CVs" ON cvs
  FOR INSERT WITH CHECK (user_id IS NULL);

CREATE POLICY "Admin can update CVs" ON cvs
  FOR UPDATE USING (user_id IS NULL);

CREATE POLICY "Admin can delete CVs" ON cvs
  FOR DELETE USING (user_id IS NULL);

-- Verify the changes
SELECT 
  column_name, 
  is_nullable, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'cvs' 
  AND column_name IN ('name', 'phone', 'user_id');

-- Show all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'cvs'; 