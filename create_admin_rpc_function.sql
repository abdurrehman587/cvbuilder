-- Create the admin_update_cv RPC function
-- This function allows admin users to create/update CVs bypassing RLS policies

CREATE OR REPLACE FUNCTION admin_update_cv(
  p_cv_id UUID DEFAULT NULL,
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
  p_other_information TEXT DEFAULT NULL,
  p_image_url TEXT DEFAULT NULL
)
RETURNS TABLE(id UUID, name TEXT, phone TEXT, email TEXT, address TEXT, objective TEXT, education TEXT, work_experience TEXT, skills TEXT, certifications TEXT, projects TEXT, languages TEXT, hobbies TEXT, "references" TEXT, other_information TEXT, image_url TEXT, user_id UUID, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
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
      objective = p_objective,
      education = p_education,
      work_experience = p_work_experience,
      skills = p_skills,
      certifications = p_certifications,
      projects = p_projects,
      languages = p_languages,
      hobbies = p_hobbies,
      "references" = p_references,
      other_information = p_other_information,
      image_url = p_image_url,
      updated_at = NOW()
    WHERE id = p_cv_id
    RETURNING * INTO result_record;
    
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
      other_information,
      image_url,
      user_id
    ) VALUES (
      p_name,
      p_phone,
      p_email,
      p_address,
      p_objective,
      p_education,
      p_work_experience,
      p_skills,
      p_certifications,
      p_projects,
      p_languages,
      p_hobbies,
      p_references,
      p_other_information,
      p_image_url,
      NULL  -- Admin-created CVs have no user_id
    )
    RETURNING * INTO result_record;
    
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
      result_record.other_information,
      result_record.image_url,
      result_record.user_id,
      result_record.created_at,
      result_record.updated_at;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_update_cv TO authenticated;

-- Grant execute permission to anon users (if needed)
GRANT EXECUTE ON FUNCTION admin_update_cv TO anon; 