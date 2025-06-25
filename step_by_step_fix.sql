-- Step-by-Step Admin Function Fix
-- Run each section separately in Supabase SQL Editor

-- =====================================================
-- STEP 1: Check what functions exist (run this first)
-- =====================================================
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'admin_update_cv' 
AND n.nspname = 'public';

-- =====================================================
-- STEP 2: Drop all existing admin_update_cv functions (run this second)
-- =====================================================
DROP FUNCTION IF EXISTS admin_update_cv(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text);
DROP FUNCTION IF EXISTS admin_update_cv(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text);
DROP FUNCTION IF EXISTS admin_update_cv(bigint,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text);
DROP FUNCTION IF EXISTS admin_update_cv();

-- =====================================================
-- STEP 3: Add custom_sections column if it doesn't exist (run this third)
-- =====================================================
ALTER TABLE cvs ADD COLUMN IF NOT EXISTS custom_sections JSONB DEFAULT '[]'::jsonb;

-- =====================================================
-- STEP 4: Update null values (run this fourth)
-- =====================================================
UPDATE cvs SET custom_sections = '[]'::jsonb WHERE custom_sections IS NULL;

-- =====================================================
-- STEP 5: Create the function (run this fifth)
-- =====================================================
CREATE OR REPLACE FUNCTION admin_update_cv(
    p_cv_id bigint DEFAULT NULL,
    p_name text DEFAULT NULL,
    p_phone text DEFAULT NULL,
    p_email text DEFAULT NULL,
    p_address text DEFAULT NULL,
    p_objective text DEFAULT NULL,
    p_education text DEFAULT NULL,
    p_work_experience text DEFAULT NULL,
    p_skills text DEFAULT NULL,
    p_certifications text DEFAULT NULL,
    p_projects text DEFAULT NULL,
    p_languages text DEFAULT NULL,
    p_hobbies text DEFAULT NULL,
    p_references text DEFAULT NULL,
    p_custom_sections text DEFAULT NULL,
    p_other_information text DEFAULT NULL,
    p_image_url text DEFAULT NULL
)
RETURNS TABLE(id bigint, name text, phone text, email text, address text, objective jsonb, education jsonb, work_experience jsonb, skills jsonb, certifications jsonb, projects jsonb, languages jsonb, hobbies jsonb, "references" jsonb, custom_sections jsonb, other_information jsonb, image_url text, user_id uuid, created_at timestamptz, updated_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_record RECORD;
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
        WHERE id = p_cv_id
        RETURNING cvs.id, cvs.name, cvs.phone, cvs.email, cvs.address, cvs.objective, cvs.education, cvs.work_experience, cvs.skills, cvs.certifications, cvs.projects, cvs.languages, cvs.hobbies, cvs."references", cvs.custom_sections, cvs.other_information, cvs.image_url, cvs.user_id, cvs.created_at, cvs.updated_at INTO result_record;
        
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
-- STEP 6: Grant permissions (run this sixth)
-- =====================================================
GRANT EXECUTE ON FUNCTION admin_update_cv(bigint,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_cv(bigint,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text,text) TO anon;

-- =====================================================
-- STEP 7: Verify the function was created (run this seventh)
-- =====================================================
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'admin_update_cv' 
AND n.nspname = 'public'; 