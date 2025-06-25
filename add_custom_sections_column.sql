-- Add custom_sections column to cvs table if it doesn't exist
-- This script will add the custom_sections column with JSONB data type

-- Check if the column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'cvs' 
        AND column_name = 'custom_sections'
    ) THEN
        ALTER TABLE cvs ADD COLUMN custom_sections JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added custom_sections column to cvs table';
    ELSE
        RAISE NOTICE 'custom_sections column already exists in cvs table';
    END IF;
END $$;

-- Update the admin_search_cvs function to include custom_sections
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
    COALESCE(cvs.custom_sections, '[]'::jsonb) as custom_sections,
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
GRANT EXECUTE ON FUNCTION admin_search_cvs(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_search_cvs(text, text) TO anon;

-- Update existing records to have empty custom_sections if they are null
UPDATE cvs SET custom_sections = '[]'::jsonb WHERE custom_sections IS NULL;

-- Show the current table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'cvs' 
ORDER BY ordinal_position; 