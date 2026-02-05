
import { useState, useEffect, useCallback, useRef } from 'react';

const useFormHandler = (formData, updateFormData, markAsChanged) => {
    // Use refs to track latest values and avoid stale closures
    const formDataRef = useRef(formData);
    const updateFormDataRef = useRef(updateFormData);
    const markAsChangedRef = useRef(markAsChanged);
    
    // Update refs when values change
    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);
    
    useEffect(() => {
        updateFormDataRef.current = updateFormData;
    }, [updateFormData]);
    
    useEffect(() => {
        markAsChangedRef.current = markAsChanged;
    }, [markAsChanged]);
    
    // Local state for references input
    // Initialize with default only if formData has no references
    const [referenceText, setReferenceText] = useState(
        formData.references && formData.references.length > 0 
            ? formData.references[0] 
            : 'References would be furnished on demand.'
    );
    const [referencesCleared, setReferencesCleared] = useState(false);
    
    // State for active section
    const [activeSection, setActiveSection] = useState('contact-info');
    
    // Debug: Track activeSection changes
    useEffect(() => {
        console.log('[FormHandler] ========== activeSection changed ==========');
        console.log('[FormHandler] New activeSection:', activeSection);
        console.log('[FormHandler] ========== activeSection change completed ==========');
    }, [activeSection]);

    // Sync referenceText with formData changes
    useEffect(() => {
        if (formData.references && formData.references.length > 0) {
            setReferenceText(formData.references[0]);
            setReferencesCleared(false);
        } else if (referencesCleared) {
            // If user has explicitly cleared it, keep it empty
            setReferenceText('');
        }
        // Don't reset to default if empty - let user control it
    }, [formData.references, referencesCleared]);

    // Handle input changes and trigger auto-save
    const handleInputChange = (field, value) => {
        console.log('[FormHandler] handleInputChange called:', { field, value });
        console.log('[FormHandler] Current formData:', formData);
        if (field === 'languages') {
            console.log('[FormHandler] Languages field being updated');
            console.log('[FormHandler] Current formData.languages:', formData.languages);
            console.log('[FormHandler] Current formData.languages type:', typeof formData.languages);
            console.log('[FormHandler] Current formData.languages is array:', Array.isArray(formData.languages));
            console.log('[FormHandler] New languages value:', value);
            console.log('[FormHandler] New languages value type:', typeof value);
            console.log('[FormHandler] New languages value is array:', Array.isArray(value));
        }
        const newFormData = { ...formData, [field]: value };
        console.log('[FormHandler] New form data:', newFormData);
        if (field === 'languages') {
            console.log('[FormHandler] New formData.languages:', newFormData.languages);
            console.log('[FormHandler] New formData.languages length:', newFormData.languages?.length);
        }
        console.log('[FormHandler] Calling updateFormData with newFormData...');
        console.log('[FormHandler] updateFormData function:', updateFormData);
        console.log('[FormHandler] typeof updateFormData:', typeof updateFormData);
        updateFormData(newFormData);
        console.log('[FormHandler] updateFormData called');
        console.log('[FormHandler] Calling markAsChanged...');
        markAsChanged();
        console.log('[FormHandler] markAsChanged called');
        console.log('[FormHandler] handleInputChange completed');
    };

    // Handle references input change
    const handleReferenceChange = (e) => {
        const value = e.target.value;
        setReferenceText(value);
        // If user clears the text, mark as cleared
        if (!value.trim()) {
            setReferencesCleared(true);
        } else {
            // If user adds text back, reset cleared flag
            setReferencesCleared(false);
        }
        const newFormData = { ...formData, references: value.trim() ? [value] : [] };
        updateFormData(newFormData);
        markAsChanged();
    };

    // React-based toggle section function
    const toggleSection = (sectionId) => {
        console.log('[FormHandler] ========== toggleSection called ==========');
        console.log('[FormHandler] Section ID:', sectionId);
        console.log('[FormHandler] Current activeSection before toggle:', activeSection);
        console.log('[FormHandler] Calling setActiveSection with:', sectionId);
        setActiveSection(sectionId);
        console.log('[FormHandler] setActiveSection called - React will update state');
        console.log('[FormHandler] ========== toggleSection completed ==========');
    };

    // Function to initialize the form - show only Contact Information on page load
    const initializeForm = useCallback(() => {
        setActiveSection('contact-info');
    }, []);

    // Function to add new education group
    const addEducationGroup = () => {
        const educationSection = document.getElementById('education');
        if (educationSection) {
            const timestamp = Date.now();
            const newEducationGroup = document.createElement('div');
            newEducationGroup.className = 'education-group';
            
            newEducationGroup.innerHTML = `
                <div class="degree-input-container input-group">
                    <label for="degree-input-${timestamp}" class="degree-label input-label">Degree</label>
                    <input id="degree-input-${timestamp}" class="degree-input styled-input" type="text" name="degree" placeholder="Enter your degree" />
                </div>
                <div class="board-input-container input-group">
                    <label for="board-input-${timestamp}" class="board-label input-label">Board/University</label>
                    <input id="board-input-${timestamp}" class="board-input styled-input" type="text" name="board" placeholder="Enter your board or university" />
                </div>
                <div class="year-input-container input-group">
                    <label for="year-input-${timestamp}" class="year-label input-label">Year</label>
                    <input id="year-input-${timestamp}" class="year-input styled-input" type="text" name="year" placeholder="Enter the year" />
                </div>
                <div class="marks-input-container input-group">
                    <label for="marks-input-${timestamp}" class="marks-label input-label">Marks/CGPA</label>
                    <input id="marks-input-${timestamp}" class="marks-input styled-input" type="text" name="marks" placeholder="Enter your marks or CGPA" />
                </div>
                <div class="remove-education-container">
                    <button type="button" class="remove-education-button" onclick="this.parentElement.parentElement.remove()">Remove Education</button>
                </div>
            `;
            
            educationSection.appendChild(newEducationGroup);
        }
    };

    // Function to add new experience group
    const addExperienceGroup = () => {
        const experienceSection = document.getElementById('experience');
        if (experienceSection) {
            const timestamp = Date.now();
            const newExperienceGroup = document.createElement('div');
            newExperienceGroup.className = 'experience-group';
            
            newExperienceGroup.innerHTML = `
                <div class="job-title-input-container input-group">
                    <label for="job-title-input-${timestamp}" class="job-title-label input-label">Job Title</label>
                    <input id="job-title-input-${timestamp}" class="job-title-input styled-input" type="text" name="jobTitle" placeholder="Enter your job title" />
                </div>
                <div class="company-input-container input-group">
                    <label for="company-input-${timestamp}" class="company-label input-label">Company</label>
                    <input id="company-input-${timestamp}" class="company-input styled-input" type="text" name="company" placeholder="Enter your company" />
                </div>
                <div class="duration-input-container input-group">
                    <label for="duration-input-${timestamp}" class="duration-label input-label">Duration</label>
                    <input id="duration-input-${timestamp}" class="duration-input styled-input" type="text" name="duration" placeholder="Enter the duration" />
                </div>
                <div class="job-details-input-container input-group">
                    <label for="job-details-textarea-${timestamp}" class="job-details-label input-label">Job Details</label>
                    <textarea id="job-details-textarea-${timestamp}" class="job-details-textarea styled-input" name="jobDetails" placeholder="Enter details about your job" rows="2"></textarea>
                </div>
                <div class="remove-experience-container">
                    <button type="button" class="remove-experience-button" onclick="this.parentElement.parentElement.remove()">Remove Experience</button>
                </div>
            `;
            
            experienceSection.appendChild(newExperienceGroup);
        }
    };

    // Function to add new skill input
    const addSkillInput = () => {
        const newSkills = [...(formData.skills || [])];
        newSkills.push('');
        updateFormData({ ...formData, skills: newSkills });
        markAsChanged();
    };

    // Function to add new certification input
    const addCertificationInput = () => {
        const newCertifications = [...(formData.certifications || [])];
        newCertifications.push('');
        updateFormData({ ...formData, certifications: newCertifications });
        markAsChanged();
    };

    // Function to add new custom information field
    const addCustomInformation = () => {
        const newOtherInfo = [...(formData.otherInfo || [])];
        newOtherInfo.push({ label: '', value: '' });
        updateFormData({ ...formData, otherInfo: newOtherInfo });
        markAsChanged();
    };


    // Function to add new language input
    // Use useCallback and refs to avoid stale closure issues
    const addLanguageInput = useCallback(() => {
        const callTimestamp = Date.now();
        console.log('[FormHandler] ========== addLanguageInput called ==========');
        console.log('[FormHandler] Call timestamp:', callTimestamp);
        const currentFormData = formDataRef.current;
        console.log('[FormHandler] Current formData from ref:', currentFormData);
        console.log('[FormHandler] Current formData.languages:', currentFormData.languages);
        console.log('[FormHandler] Current formData.languages type:', typeof currentFormData.languages);
        console.log('[FormHandler] Current formData.languages is array:', Array.isArray(currentFormData.languages));
        const currentLanguages = Array.isArray(currentFormData.languages) ? currentFormData.languages : [];
        console.log('[FormHandler] currentLanguages after check:', currentLanguages);
        console.log('[FormHandler] currentLanguages length:', currentLanguages.length);
        console.log('[FormHandler] currentLanguages structure:', currentLanguages.map((lang, idx) => ({
            index: idx,
            type: typeof lang,
            value: lang,
            isString: typeof lang === 'string',
            isObject: typeof lang === 'object' && lang !== null
        })));
        const newLanguage = { name: '', level: '' };
        console.log('[FormHandler] New language object to add:', newLanguage);
        const newLanguages = [...currentLanguages, newLanguage];
        console.log('[FormHandler] newLanguages after adding:', newLanguages);
        console.log('[FormHandler] newLanguages length:', newLanguages.length);
        console.log('[FormHandler] Languages array reference changed:', currentLanguages !== newLanguages);
        const newFormData = { ...currentFormData, languages: newLanguages };
        console.log('[FormHandler] newFormData:', newFormData);
        console.log('[FormHandler] newFormData.languages:', newFormData.languages);
        console.log('[FormHandler] newFormData.languages length:', newFormData.languages.length);
        console.log('[FormHandler] FormData reference changed:', currentFormData !== newFormData);
        console.log('[FormHandler] updateFormDataRef.current:', updateFormDataRef.current);
        console.log('[FormHandler] typeof updateFormDataRef.current:', typeof updateFormDataRef.current);
        console.log('[FormHandler] updateFormDataRef.current is function:', typeof updateFormDataRef.current === 'function');
        if (typeof updateFormDataRef.current !== 'function') {
            console.error('[FormHandler] ❌ CRITICAL ERROR: updateFormDataRef.current is not a function!');
            return;
        }
        console.log('[FormHandler] Calling updateFormDataRef.current with newFormData...');
        const beforeUpdate = Date.now();
        try {
            updateFormDataRef.current(newFormData);
            const afterUpdate = Date.now();
            console.log('[FormHandler] ✅ updateFormDataRef.current called successfully');
            console.log('[FormHandler] Function execution time:', afterUpdate - beforeUpdate, 'ms');
            console.log('[FormHandler] State update scheduled - React should re-render');
            console.log('[FormHandler] React will batch this update and re-render asynchronously');
        } catch (error) {
            console.error('[FormHandler] ❌ ERROR calling updateFormDataRef.current:', error);
            console.error('[FormHandler] Error stack:', error.stack);
        }
        console.log('[FormHandler] markAsChangedRef.current:', markAsChangedRef.current);
        console.log('[FormHandler] typeof markAsChangedRef.current:', typeof markAsChangedRef.current);
        console.log('[FormHandler] Calling markAsChangedRef.current...');
        try {
            markAsChangedRef.current();
            console.log('[FormHandler] markAsChangedRef.current called successfully');
        } catch (error) {
            console.error('[FormHandler] ERROR calling markAsChangedRef.current:', error);
        }
        console.log('[FormHandler] ========== addLanguageInput completed ==========');
    }, []); // Empty deps array since we're using refs

    // Function to add new hobby input
    const addHobbyInput = () => {
        const newHobbies = [...(formData.hobbies || [])];
        newHobbies.push('');
        updateFormData({ ...formData, hobbies: newHobbies });
        markAsChanged();
    };


  // Function to add a detail to a specific custom section
  const addCustomSectionDetail = (sectionIndex) => {
    const newCustomSection = [...(formData.customSection || [])];
    if (!newCustomSection[sectionIndex]) {
      newCustomSection[sectionIndex] = { heading: '', details: [''] };
    }
    if (!newCustomSection[sectionIndex].details) {
      newCustomSection[sectionIndex].details = [''];
    }
    newCustomSection[sectionIndex].details.push('');
    updateFormData({ ...formData, customSection: newCustomSection });
    markAsChanged();
  };

  // Function to add a new custom section (adds a completely new section with heading and one detail)
  const addCustomSection = () => {
    const newCustomSection = [...(formData.customSection || [])];
    newCustomSection.push({ heading: '', details: [''] });
    updateFormData({ ...formData, customSection: newCustomSection });
    markAsChanged();
  };

    // Simple function to add new reference input
    const addReferenceInput = () => {
        const referencesSection = document.getElementById('references');
        if (referencesSection) {
            const timestamp = Date.now();
            const newReferenceContainer = document.createElement('div');
            newReferenceContainer.className = 'reference-input-container input-group';
            
            newReferenceContainer.innerHTML = `
                <div class="reference-input-wrapper">
                    <input id="reference-input-${timestamp}" class="reference-input styled-input" type="text" name="reference" placeholder="Enter a reference" />
                    <button type="button" class="remove-reference-button" onclick="this.parentElement.parentElement.remove()">Remove</button>
                </div>
            `;
            
            const addReferenceContainer = referencesSection.querySelector('.add-reference-container');
            if (addReferenceContainer) {
                referencesSection.insertBefore(newReferenceContainer, addReferenceContainer);
            } else {
                referencesSection.appendChild(newReferenceContainer);
            }
        }
    };

    const returnObject = {
        toggleSection,
        initializeForm,
        addEducationGroup,
        addExperienceGroup,
        addSkillInput,
        addCertificationInput,
        addCustomInformation,
        addLanguageInput,
        addHobbyInput,
        addCustomSectionDetail,
        addCustomSection,
        addReferenceInput,
        handleInputChange,
        handleReferenceChange,
        referenceText,
        activeSection,
    };
    
    console.log('[FormHandler] Returning from useFormHandler');
    console.log('[FormHandler] addLanguageInput in return object:', returnObject.addLanguageInput);
    console.log('[FormHandler] typeof addLanguageInput:', typeof returnObject.addLanguageInput);
    console.log('[FormHandler] Full return object keys:', Object.keys(returnObject));
    
    return returnObject;
};

export default useFormHandler;
