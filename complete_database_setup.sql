-- Complete Database Setup for CV Builder with Custom Sections
-- Run this script in your Supabase SQL Editor or PostgreSQL database

-- =====================================================
-- 1. ADD CUSTOM_SECTIONS COLUMN TO CVS TABLE
-- =====================================================

-- Add custom_sections column if it doesn't exist
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS custom_sections JSONB DEFAULT '[]'::jsonb;

-- Update existing records to have an empty custom_sections array
UPDATE cvs SET custom_sections = '[]'::jsonb WHERE custom_sections IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN cvs.custom_sections IS 'JSON array of custom sections with heading and details';

-- =====================================================
-- 2. DROP ALL EXISTING ADMIN_UPDATE_CV FUNCTIONS
-- =====================================================

-- Drop all existing admin_update_cv functions with different signatures
DROP FUNCTION IF EXISTS admin_update_cv(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text);
DROP FUNCTION IF EXISTS admin_update_cv(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text);
DROP FUNCTION IF EXISTS admin_update_cv(bigint,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text);
DROP FUNCTION IF EXISTS admin_update_cv();

-- =====================================================
-- 3. CREATE UPDATED ADMIN_UPDATE_CV FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION admin_update_cv(
  p_cv_id BIGINT DEFAULT NULL,
  p_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_objective TEXT DEFAULT NULL,
  p_education TEXT DEFAULT NULL,
  p_work_experience TEXT DEFAULT NULL,
  p_skills TEXT DEFAULT NULL,
  p_certifications TEXT DEFAULT NULL,
  p_projects TEXT DEFAULT NULL,
  p_languages TEXT DEFAULT NULL,
  p_hobbies TEXT DEFAULT NULL,
  p_references TEXT DEFAULT NULL,
  p_custom_sections TEXT DEFAULT NULL,
  p_other_information TEXT DEFAULT NULL,
  p_image_url TEXT DEFAULT NULL
)
RETURNS TABLE(id BIGINT, name TEXT, phone TEXT, email TEXT, address TEXT, objective JSONB, education JSONB, work_experience JSONB, skills JSONB, certifications JSONB, projects JSONB, languages JSONB, hobbies JSONB, "references" JSONB, custom_sections JSONB, other_information JSONB, image_url TEXT, user_id UUID, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_record RECORD;
BEGIN
  -- Check if this is an update (p_cv_id provided) or insert (p_cv_id is null)
  IF p_cv_id IS NOT NULL THEN
    -- Update existing CV
    UPDATE cvs 
    SET 
      name = p_name,
      phone = p_phone,
      email = p_email,
      address = p_address,
      objective = p_objective::jsonb,
      education = p_education::jsonb,
      work_experience = p_work_experience::jsonb,
      skills = p_skills::jsonb,
      certifications = p_certifications::jsonb,
      projects = p_projects::jsonb,
      languages = p_languages::jsonb,
      hobbies = p_hobbies::jsonb,
      "references" = p_references::jsonb,
      custom_sections = p_custom_sections::jsonb,
      other_information = p_other_information::jsonb,
      image_url = p_image_url,
      updated_at = NOW()
    WHERE cvs.id = p_cv_id
    RETURNING cvs.id, cvs.name, cvs.phone, cvs.email, cvs.address, cvs.objective, cvs.education, cvs.work_experience, cvs.skills, cvs.certifications, cvs.projects, cvs.languages, cvs.hobbies, cvs."references", cvs.custom_sections, cvs.other_information, cvs.image_url, cvs.user_id, cvs.created_at, cvs.updated_at INTO result_record;
    
    -- Return the updated record
    RETURN QUERY SELECT 
      result_record.id,
      result_record.name,
      result_record.phone,
      result_record.email,
      result_record.address,
      result_record.objective,
      result_record.education,
      result_record.work_experience,
      result_record.skills,
      result_record.certifications,
      result_record.projects,
      result_record.languages,
      result_record.hobbies,
      result_record."references",
      result_record.custom_sections,
      result_record.other_information,
      result_record.image_url,
      result_record.user_id,
      result_record.created_at,
      result_record.updated_at;
  ELSE
    -- Insert new CV
    INSERT INTO cvs (
      name,
      phone,
      email,
      address,
      objective,
      education,
      work_experience,
      skills,
      certifications,
      projects,
      languages,
      hobbies,
      "references",
      custom_sections,
      other_information,
      image_url,
      user_id
    ) VALUES (
      p_name,
      p_phone,
      p_email,
      p_address,
      p_objective::jsonb,
      p_education::jsonb,
      p_work_experience::jsonb,
      p_skills::jsonb,
      p_certifications::jsonb,
      p_projects::jsonb,
      p_languages::jsonb,
      p_hobbies::jsonb,
      p_references::jsonb,
      p_custom_sections::jsonb,
      p_other_information::jsonb,
      p_image_url,
      NULL  -- Admin-created CVs have no user_id
    )
    RETURNING cvs.id, cvs.name, cvs.phone, cvs.email, cvs.address, cvs.objective, cvs.education, cvs.work_experience, cvs.skills, cvs.certifications, cvs.projects, cvs.languages, cvs.hobbies, cvs."references", cvs.custom_sections, cvs.other_information, cvs.image_url, cvs.user_id, cvs.created_at, cvs.updated_at INTO result_record;
    
    -- Return the inserted record
    RETURN QUERY SELECT 
      result_record.id,
      result_record.name,
      result_record.phone,
      result_record.email,
      result_record.address,
      result_record.objective,
      result_record.education,
      result_record.work_experience,
      result_record.skills,
      result_record.certifications,
      result_record.projects,
      result_record.languages,
      result_record.hobbies,
      result_record."references",
      result_record.custom_sections,
      result_record.other_information,
      result_record.image_url,
      result_record.user_id,
      result_record.created_at,
      result_record.updated_at;
  END IF;
END;
$$;

-- =====================================================
-- 4. UPDATE ADMIN SEARCH FUNCTIONS
-- =====================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS admin_get_all_cvs();
DROP FUNCTION IF EXISTS admin_search_cvs(text, text);

-- Function to get all CVs (admin only) - Updated with custom_sections
CREATE OR REPLACE FUNCTION admin_get_all_cvs()
RETURNS TABLE(id BIGINT, name TEXT, phone TEXT, email TEXT, address TEXT, objective JSONB, education JSONB, work_experience JSONB, skills JSONB, certifications JSONB, projects JSONB, languages JSONB, hobbies JSONB, "references" JSONB, custom_sections JSONB, other_information JSONB, image_url TEXT, user_id UUID, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT 
    cvs.id,
    cvs.name,
    cvs.phone,
    cvs.email,
    cvs.address,
    cvs.objective,
    cvs.education,
    cvs.work_experience,
    cvs.skills,
    cvs.certifications,
    cvs.projects,
    cvs.languages,
    cvs.hobbies,
    cvs."references",
    cvs.custom_sections,
    cvs.other_information,
    cvs.image_url,
    cvs.user_id,
    cvs.created_at,
    cvs.updated_at
  FROM cvs
  ORDER BY cvs.created_at DESC;
END;
$$;

-- Function to search CVs by name and/or phone (admin only) - Updated with custom_sections
CREATE OR REPLACE FUNCTION admin_search_cvs(
  p_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS TABLE(id BIGINT, name TEXT, phone TEXT, email TEXT, address TEXT, objective JSONB, education JSONB, work_experience JSONB, skills JSONB, certifications JSONB, projects JSONB, languages JSONB, hobbies JSONB, "references" JSONB, custom_sections JSONB, other_information JSONB, image_url TEXT, user_id UUID, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT 
    cvs.id,
    cvs.name,
    cvs.phone,
    cvs.email,
    cvs.address,
    cvs.objective,
    cvs.education,
    cvs.work_experience,
    cvs.skills,
    cvs.certifications,
    cvs.projects,
    cvs.languages,
    cvs.hobbies,
    cvs."references",
    cvs.custom_sections,
    cvs.other_information,
    cvs.image_url,
    cvs.user_id,
    cvs.created_at,
    cvs.updated_at
  FROM cvs
  WHERE 
    (p_name IS NULL OR cvs.name ILIKE '%' || p_name || '%')
    AND (p_phone IS NULL OR cvs.phone ILIKE '%' || p_phone || '%')
  ORDER BY cvs.created_at DESC;
END;
$$;

-- =====================================================
-- 5. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_update_cv TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_all_cvs() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_search_cvs(text, text) TO authenticated;

-- Grant execute permission to anon users (if needed)
GRANT EXECUTE ON FUNCTION admin_update_cv TO anon;
GRANT EXECUTE ON FUNCTION admin_get_all_cvs() TO anon;
GRANT EXECUTE ON FUNCTION admin_search_cvs(text, text) TO anon;

-- =====================================================
-- 6. VERIFICATION QUERIES
-- =====================================================

-- Check if custom_sections column exists
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'cvs' AND column_name = 'custom_sections';

-- Check if admin_update_cv function exists with correct signature
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'admin_update_cv' AND n.nspname = 'public';

-- Check if admin search functions exist
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE 'admin_%' AND n.nspname = 'public'
ORDER BY p.proname;

-- Test the admin_update_cv function (optional)
-- SELECT * FROM admin_update_cv(
--   p_name := 'Test User',
--   p_phone := '1234567890',
--   p_email := 'test@example.com',
--   p_custom_sections := '[{"heading": "Test Section", "details": ["Test Detail"]}]'
-- ); 