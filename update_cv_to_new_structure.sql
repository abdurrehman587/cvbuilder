-- Update CV ID 32 (Jahangir Khan) to use the new custom sections structure
-- Convert from old structure (heading/details) to new structure (title/items)

UPDATE cvs 
SET 
    custom_sections = '[{"id": 1, "title": "Military Qualification", "items": ["Basic Radio Interception Course from Defense Service Academy Islamabad. (Grade:A)", "JCOs NCOs Elect Warfare Course from Signal Training Center Kohat (Grade:B)", "Advance Leadhsip Course from Junior Leadership Academy Shinkiari (Grade:A)"]}]'::jsonb,
    updated_at = NOW()
WHERE id = 32;

-- Verify the update
SELECT 
    id,
    name,
    custom_sections,
    updated_at
FROM cvs 
WHERE id = 32; 