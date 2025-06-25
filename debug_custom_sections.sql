-- Debug version of admin_update_cv function to track custom sections issues
DROP FUNCTION IF EXISTS admin_update_cv(bigint, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text);

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
    v_custom_sections_jsonb jsonb;
    v_other_information_jsonb jsonb;
BEGIN
    -- Debug logging for custom sections
    RAISE NOTICE 'DEBUG: p_custom_sections input: %', p_custom_sections;
    RAISE NOTICE 'DEBUG: p_custom_sections type: %', pg_typeof(p_custom_sections);
    RAISE NOTICE 'DEBUG: p_custom_sections length: %', length(p_custom_sections);
    
    -- Process custom sections with better error handling
    BEGIN
        IF p_custom_sections IS NULL OR p_custom_sections = '' OR p_custom_sections = 'null' THEN
            v_custom_sections_jsonb := '[]'::jsonb;
            RAISE NOTICE 'DEBUG: Setting custom_sections to empty array';
        ELSE
            v_custom_sections_jsonb := p_custom_sections::jsonb;
            RAISE NOTICE 'DEBUG: Successfully converted custom_sections to JSONB: %', v_custom_sections_jsonb;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'DEBUG: Error converting custom_sections to JSONB: %', SQLERRM;
        v_custom_sections_jsonb := '[]'::jsonb;
    END;
    
    -- Process other information with better error handling
    BEGIN
        IF p_other_information IS NULL OR p_other_information = '' OR p_other_information = 'null' THEN
            v_other_information_jsonb := '[]'::jsonb;
            RAISE NOTICE 'DEBUG: Setting other_information to empty array';
        ELSE
            v_other_information_jsonb := p_other_information::jsonb;
            RAISE NOTICE 'DEBUG: Successfully converted other_information to JSONB: %', v_other_information_jsonb;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'DEBUG: Error converting other_information to JSONB: %', SQLERRM;
        v_other_information_jsonb := '[]'::jsonb;
    END;

    -- If p_cv_id is NULL, create a new CV
    IF p_cv_id IS NULL THEN
        RAISE NOTICE 'DEBUG: Creating new CV';
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
            v_custom_sections_jsonb,
            v_other_information_jsonb,
            p_image_url,
            auth.uid()
        ) RETURNING cvs.id INTO v_cv_id;
        RAISE NOTICE 'DEBUG: New CV created with ID: %', v_cv_id;
    ELSE
        -- Update existing CV
        RAISE NOTICE 'DEBUG: Updating existing CV with ID: %', p_cv_id;
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
            custom_sections = v_custom_sections_jsonb,
            other_information = v_other_information_jsonb,
            image_url = p_image_url,
            updated_at = NOW()
        WHERE cvs.id = p_cv_id;
        
        v_cv_id := p_cv_id;
        RAISE NOTICE 'DEBUG: CV updated successfully';
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

    RAISE NOTICE 'DEBUG: Final custom_sections in database: %', v_result.custom_sections;
    RAISE NOTICE 'DEBUG: Final other_information in database: %', v_result.other_information;

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
GRANT EXECUTE ON FUNCTION admin_update_cv(bigint, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_cv(bigint, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text) TO anon; 