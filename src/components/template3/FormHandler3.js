
import { useState, useEffect, useCallback } from 'react';

const useFormHandler = (formData, updateFormData, markAsChanged) => {
    // Local state for references input
    const [referenceText, setReferenceText] = useState('References would be furnished on demand.');
    
    // State for active section
    const [activeSection, setActiveSection] = useState('contact-info');

    // Sync referenceText with formData changes
    useEffect(() => {
        if (formData.references && formData.references.length > 0) {
            setReferenceText(formData.references[0]);
        } else {
            setReferenceText('References would be furnished on demand.');
        }
    }, [formData.references]);

    // Handle input changes and trigger auto-save
    const handleInputChange = (field, value) => {
        console.log('handleInputChange called:', { field, value });
        const newFormData = { ...formData, [field]: value };
        console.log('New form data:', newFormData);
        updateFormData(newFormData);
        markAsChanged();
    };

    // Handle references input change
    const handleReferenceChange = (e) => {
        const value = e.target.value;
        setReferenceText(value);
        const newFormData = { ...formData, references: value.trim() ? [value] : [] };
        updateFormData(newFormData);
        markAsChanged();
    };

    // Sync local reference text with form data
    useEffect(() => {
        if (formData.references && formData.references.length > 0) {
            setReferenceText(formData.references[0]);
        }
    }, [formData.references]);

    // React-based toggle section function
    const toggleSection = (sectionId) => {
        setActiveSection(sectionId);
    };

    // Initialize languages with default values on component mount
    useEffect(() => {
        console.log('FormHandler3 - Checking languages:', formData.languages);
        if (!formData.languages || formData.languages.length === 0) {
            console.log('Initializing default languages...');
            const newFormData = { ...formData, languages: ['English', 'Urdu', 'Punjabi'] };
            updateFormData(newFormData);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    // Track if languages have been explicitly cleared by user
    const [languagesCleared, setLanguagesCleared] = useState(false);

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
    const addLanguageInput = () => {
        const newLanguages = [...(formData.languages || [])];
        newLanguages.push('');
        updateFormData({ ...formData, languages: newLanguages });
        markAsChanged();
    };

    // Function to add new hobby input
    const addHobbyInput = () => {
        const newHobbies = [...(formData.hobbies || [])];
        newHobbies.push('');
        updateFormData({ ...formData, hobbies: newHobbies });
        markAsChanged();
    };


  // Function to add new custom section detail
  const addCustomSectionDetail = () => {
    // Simply add a new empty detail to the form state
    const newCustomSection = [...(formData.customSection || [])];
    newCustomSection.push({ heading: '', detail: '' });
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

    return {
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
        addReferenceInput,
        handleInputChange,
        handleReferenceChange,
        referenceText,
        activeSection,
        languagesCleared,
        setLanguagesCleared
    };
};

export default useFormHandler;

