-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS admin_get_all_cvs();
DROP FUNCTION IF EXISTS admin_search_cvs(text, text);

-- Function to get all CVs (admin only)
CREATE OR REPLACE FUNCTION admin_get_all_cvs()
RETURNS TABLE(id BIGINT, name TEXT, phone TEXT, email TEXT, address TEXT, objective JSONB, education JSONB, work_experience JSONB, skills JSONB, certifications JSONB, projects JSONB, languages JSONB, hobbies JSONB, "references" JSONB, other_information JSONB, image_url TEXT, user_id UUID, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
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
    cvs.other_information,
    cvs.image_url,
    cvs.user_id,
    cvs.created_at,
    cvs.updated_at
  FROM cvs
  ORDER BY cvs.created_at DESC;
END;
$$;

-- Function to search CVs by name and/or phone (admin only)
CREATE OR REPLACE FUNCTION admin_search_cvs(
  p_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS TABLE(id BIGINT, name TEXT, phone TEXT, email TEXT, address TEXT, objective JSONB, education JSONB, work_experience JSONB, skills JSONB, certifications JSONB, projects JSONB, languages JSONB, hobbies JSONB, "references" JSONB, other_information JSONB, image_url TEXT, user_id UUID, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION admin_get_all_cvs() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_all_cvs() TO anon;
GRANT EXECUTE ON FUNCTION admin_search_cvs(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_search_cvs(text, text) TO anon; 