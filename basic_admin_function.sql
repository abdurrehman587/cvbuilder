-- Basic Admin Function - Simple Version
-- Run this in Supabase SQL Editor

-- Step 1: Drop any existing functions
DROP FUNCTION IF EXISTS admin_update_cv(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text);
DROP FUNCTION IF EXISTS admin_update_cv(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text);
DROP FUNCTION IF EXISTS admin_update_cv(bigint,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text);
DROP FUNCTION IF EXISTS admin_update_cv();

-- Step 2: Add column
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS custom_sections JSONB DEFAULT '[]'::jsonb;

-- Step 3: Create simple function
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
BEGIN
  IF p_cv_id IS NOT NULL THEN
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
    WHERE cvs.id = p_cv_id;
    
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
    FROM cvs WHERE cvs.id = p_cv_id;
  ELSE
    INSERT INTO cvs (
      name, phone, email, address, objective, education, work_experience, 
      skills, certifications, projects, languages, hobbies, "references", 
      custom_sections, other_information, image_url, created_at, updated_at
    ) VALUES (
      p_name, p_phone, p_email, p_address, p_objective::jsonb, p_education::jsonb, p_work_experience::jsonb,
      p_skills::jsonb, p_certifications::jsonb, p_projects::jsonb, p_languages::jsonb, p_hobbies::jsonb, p_references::jsonb,
      p_custom_sections::jsonb, p_other_information::jsonb, p_image_url, NOW(), NOW()
    );
    
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
    FROM cvs ORDER BY cvs.created_at DESC LIMIT 1;
  END IF;
END;
$$;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION admin_update_cv(bigint,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_cv(bigint,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text) TO anon;

-- Step 5: Test
SELECT 'Function created successfully' as status; 