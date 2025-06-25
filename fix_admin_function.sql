-- Fix Admin Update CV Function
-- This script ensures the admin_update_cv function exists with the correct signature

-- =====================================================
-- 1. DROP ALL EXISTING ADMIN_UPDATE_CV FUNCTIONS
-- =====================================================

-- Drop all existing admin_update_cv functions with different signatures
DROP FUNCTION IF EXISTS admin_update_cv(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text);
DROP FUNCTION IF EXISTS admin_update_cv(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text);
DROP FUNCTION IF EXISTS admin_update_cv(bigint,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text);
DROP FUNCTION IF EXISTS admin_update_cv();

-- =====================================================
-- 2. CREATE THE CORRECT ADMIN_UPDATE_CV FUNCTION
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
      name, phone, email, address, objective, education, work_experience, 
      skills, certifications, projects, languages, hobbies, "references", 
      custom_sections, other_information, image_url, created_at, updated_at
    ) VALUES (
      p_name, p_phone, p_email, p_address, p_objective::jsonb, p_education::jsonb, p_work_experience::jsonb,
      p_skills::jsonb, p_certifications::jsonb, p_projects::jsonb, p_languages::jsonb, p_hobbies::jsonb, p_references::jsonb,
      p_custom_sections::jsonb, p_other_information::jsonb, p_image_url, NOW(), NOW()
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
-- 3. GRANT EXECUTE PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION admin_update_cv(bigint,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_cv(bigint,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text) TO anon;

-- =====================================================
-- 4. VERIFY FUNCTION EXISTS
-- =====================================================

-- Check if the function was created successfully
SELECT 
  routine_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'admin_update_cv' AND n.nspname = 'public';

-- =====================================================
-- 5. ENSURE CUSTOM_SECTIONS COLUMN EXISTS
-- =====================================================

-- Add custom_sections column if it doesn't exist
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS custom_sections JSONB DEFAULT '[]'::jsonb;

-- Update existing records to have an empty custom_sections array if they are null
UPDATE cvs SET custom_sections = '[]'::jsonb WHERE custom_sections IS NULL;

-- =====================================================
-- 6. FINAL VERIFICATION
-- =====================================================

-- Check if custom_sections column exists
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