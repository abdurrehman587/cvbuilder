-- Revert CV ID 32 (Jahangir Khan) back to the working version
-- This will restore the old structure that was loading correctly

UPDATE cvs 
SET 
    custom_sections = '[{"details": ["Basic Radio Interception Course from Defense Service Academy Islamabad. (Grade:A)", "JCOs NCOs Elect Warfare Course from Signal Training Center Kohat (Grade:B)", "Advance Leadhsip Course from Junior Leadership Academy Shinkiari (Grade:A)"], "heading": "Military Qualification"}]'::jsonb,
    other_information = '[{"id": 1, "name": "parentSpouse", "label": "Father''s Name:", "value": "Zakria Khan", "checked": true, "labelType": "radio", "radioValue": "father"}, {"id": 2, "name": "parentSpouse", "label": "Husband''s Name:", "value": "", "checked": false, "labelType": "radio", "radioValue": "husband"}, {"id": 3, "label": "CNIC:", "value": "35201-7925933-9", "checked": true, "isCustom": false, "labelType": "checkbox"}, {"id": 4, "label": "Date of Birth:", "value": "04-02-1967", "checked": true, "isCustom": false, "labelType": "checkbox"}, {"id": 5, "label": "Marital Status:", "value": "Married", "checked": true, "isCustom": false, "labelType": "checkbox"}, {"id": 6, "label": "Religion:", "value": "Islam", "checked": true, "isCustom": false, "labelType": "checkbox"}, {"id": 7, "label": "Medical Category", "value": "A", "checked": true, "isCustom": true, "labelType": "checkbox"}]'::jsonb,
    updated_at = NOW()
WHERE id = 32;

-- Verify the revert
SELECT 
    id,
    name,
    custom_sections,
    other_information,
    updated_at
FROM cvs 
WHERE id = 32; 