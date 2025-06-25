-- Drop all existing admin_update_cv functions with different signatures
DROP FUNCTION IF EXISTS admin_update_cv(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text);
DROP FUNCTION IF EXISTS admin_update_cv(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text);
DROP FUNCTION IF EXISTS admin_update_cv(bigint, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS admin_update_cv();

-- Create the fixed function with proper column references
CREATE OR REPLACE FUNCTION admin_update_cv(
    p_cv_id bigint,
    p_name text,
    p_phone text,
    p_email text,
    p_address text,
    p_objective text,
    p_education text,
    p_work_experience text,
    p_skills text,
    p_certifications text,
    p_projects text,
    p_languages text,
    p_hobbies text,
    p_references text,
    p_custom_sections text,
    p_other_information text,
    p_image_url text
)
RETURNS TABLE(
    id bigint, 
    name text, 
    phone text, 
    email text, 
    address text, 
    objective jsonb, 
    education jsonb, 
    work_experience jsonb, 
    skills jsonb, 
    certifications jsonb, 
    projects jsonb, 
    languages jsonb, 
    hobbies jsonb, 
    "references" jsonb, 
    custom_sections jsonb, 
    other_information jsonb, 
    image_url text, 
    user_id uuid, 
    created_at timestamp with time zone, 
    updated_at timestamp with time zone
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_cv_id bigint;
    v_result RECORD;
BEGIN
    -- If p_cv_id is NULL, create a new CV
    IF p_cv_id IS NULL THEN
        INSERT INTO cvs (
            name, phone, email, address, objective, education, 
            work_experience, skills, certifications, projects, 
            languages, hobbies, "references", custom_sections, 
            other_information, image_url, user_id
        ) VALUES (
            p_name, p_phone, p_email, p_address, 
            CASE WHEN p_objective IS NULL OR p_objective = '' THEN '[]'::jsonb ELSE p_objective::jsonb END,
            CASE WHEN p_education IS NULL OR p_education = '' THEN '[]'::jsonb ELSE p_education::jsonb END,
            CASE WHEN p_work_experience IS NULL OR p_work_experience = '' THEN '[]'::jsonb ELSE p_work_experience::jsonb END,
            CASE WHEN p_skills IS NULL OR p_skills = '' THEN '[]'::jsonb ELSE p_skills::jsonb END,
            CASE WHEN p_certifications IS NULL OR p_certifications = '' THEN '[]'::jsonb ELSE p_certifications::jsonb END,
            CASE WHEN p_projects IS NULL OR p_projects = '' THEN '[]'::jsonb ELSE p_projects::jsonb END,
            CASE WHEN p_languages IS NULL OR p_languages = '' THEN '[]'::jsonb ELSE p_languages::jsonb END,
            CASE WHEN p_hobbies IS NULL OR p_hobbies = '' THEN '[]'::jsonb ELSE p_hobbies::jsonb END,
            CASE WHEN p_references IS NULL OR p_references = '' THEN '[]'::jsonb ELSE p_references::jsonb END,
            CASE WHEN p_custom_sections IS NULL OR p_custom_sections = '' THEN '[]'::jsonb ELSE p_custom_sections::jsonb END,
            CASE WHEN p_other_information IS NULL OR p_other_information = '' THEN '[]'::jsonb ELSE p_other_information::jsonb END,
            p_image_url,
            auth.uid()
        ) RETURNING cvs.id INTO v_cv_id;
    ELSE
        -- Update existing CV
        UPDATE cvs SET
            name = p_name,
            phone = p_phone,
            email = p_email,
            address = p_address,
            objective = CASE WHEN p_objective IS NULL OR p_objective = '' THEN '[]'::jsonb ELSE p_objective::jsonb END,
            education = CASE WHEN p_education IS NULL OR p_education = '' THEN '[]'::jsonb ELSE p_education::jsonb END,
            work_experience = CASE WHEN p_work_experience IS NULL OR p_work_experience = '' THEN '[]'::jsonb ELSE p_work_experience::jsonb END,
            skills = CASE WHEN p_skills IS NULL OR p_skills = '' THEN '[]'::jsonb ELSE p_skills::jsonb END,
            certifications = CASE WHEN p_certifications IS NULL OR p_certifications = '' THEN '[]'::jsonb ELSE p_certifications::jsonb END,
            projects = CASE WHEN p_projects IS NULL OR p_projects = '' THEN '[]'::jsonb ELSE p_projects::jsonb END,
            languages = CASE WHEN p_languages IS NULL OR p_languages = '' THEN '[]'::jsonb ELSE p_languages::jsonb END,
            hobbies = CASE WHEN p_hobbies IS NULL OR p_hobbies = '' THEN '[]'::jsonb ELSE p_hobbies::jsonb END,
            "references" = CASE WHEN p_references IS NULL OR p_references = '' THEN '[]'::jsonb ELSE p_references::jsonb END,
            custom_sections = CASE WHEN p_custom_sections IS NULL OR p_custom_sections = '' THEN '[]'::jsonb ELSE p_custom_sections::jsonb END,
            other_information = CASE WHEN p_other_information IS NULL OR p_other_information = '' THEN '[]'::jsonb ELSE p_other_information::jsonb END,
            image_url = p_image_url,
            updated_at = NOW()
        WHERE cvs.id = p_cv_id;
        
        v_cv_id := p_cv_id;
    END IF;

    -- Return the updated/created CV record
    SELECT 
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
    INTO v_result
    FROM cvs
    WHERE cvs.id = v_cv_id;

    RETURN QUERY SELECT 
        v_result.id,
        v_result.name,
        v_result.phone,
        v_result.email,
        v_result.address,
        v_result.objective,
        v_result.education,
        v_result.work_experience,
        v_result.skills,
        v_result.certifications,
        v_result.projects,
        v_result.languages,
        v_result.hobbies,
        v_result."references",
        v_result.custom_sections,
        v_result.other_information,
        v_result.image_url,
        v_result.user_id,
        v_result.created_at,
        v_result.updated_at;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION admin_update_cv(bigint, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_cv(bigint, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text) TO anon;

-- Verify the function was created successfully
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'admin_update_cv' AND n.nspname = 'public'; 