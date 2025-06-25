-- Test the admin_update_cv function with custom sections data
-- This will help us verify if the function is working correctly

-- Test data for custom sections (new structure with title and items)
SELECT admin_update_cv(
    27, -- p_cv_id (existing CV)
    'Fahad Akmal Rao', -- p_name
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
    '[{"id": 1, "title": "Test Section", "items": ["Test item 1", "Test item 2"]}]', -- p_custom_sections
    '[{"id": 1, "name": "parentSpouse", "label": "Father''s Name:", "value": "Test Father", "checked": true, "labelType": "radio", "radioValue": "father"}]', -- p_other_information
    null -- p_image_url
);

-- Check the result
SELECT 
    id,
    name,
    custom_sections,
    other_information,
    updated_at
FROM cvs 
WHERE id = 27; 