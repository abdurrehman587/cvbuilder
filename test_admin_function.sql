-- Test the admin_update_cv function to see if it can update custom sections
-- This will help us verify if the function is working correctly

-- First, let's see the current state
SELECT 
    id,
    name,
    custom_sections,
    updated_at
FROM cvs 
WHERE name = 'Jahangir Khan'
ORDER BY updated_at DESC
LIMIT 1;

-- Now test the function with custom sections data
SELECT admin_update_cv(
    32, -- p_cv_id (Jahangir Khan CV)
    'Jahangir Khan', -- p_name
    '1234567890', -- p_phone
    'test@example.com', -- p_email
    'Test Address', -- p_address
    '[]', -- p_objective
    '[]', -- p_education
    '[]', -- p_work_experience
    '[]', -- p_skills
    '[]', -- p_certifications
    '[]', -- p_projects
    '[]', -- p_languages
    '[]', -- p_hobbies
    '[]', -- p_references
    '[{"id": 1, "title": "Updated Military Qualification", "items": ["Updated Course 1", "Updated Course 2", "Updated Course 3"]}]', -- p_custom_sections
    '[]', -- p_other_information
    null -- p_image_url
);

-- Check if the update worked
SELECT 
    id,
    name,
    custom_sections,
    updated_at
FROM cvs 
WHERE id = 32; 