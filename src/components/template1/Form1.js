import React, { useEffect, useMemo, useRef } from 'react';
import useFormHandler from './FormHandler1';
import './Form1.css';

function Form({ formData, updateFormData, markAsChanged }) {
    const { 
        toggleSection, 
        initializeForm, 
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
        activeSection
    } = useFormHandler(formData, updateFormData, markAsChanged);

    // Render counter for debugging
    const renderCountRef = useRef(0);
    renderCountRef.current += 1;
    
    // Log every render
    const renderTimestamp = Date.now();
    console.log('[Form1] ========== Component RENDER ==========');
    console.log('[Form1] Render timestamp:', renderTimestamp);
    console.log('[Form1] Render count:', renderCountRef.current);
    console.log('[Form1] formData.languages:', formData.languages);
    console.log('[Form1] formData.languages length:', formData.languages?.length);
    console.log('[Form1] formData.languages type:', typeof formData.languages);
    console.log('[Form1] formData.languages is array:', Array.isArray(formData.languages));
    if (Array.isArray(formData.languages) && formData.languages.length > 0) {
        console.log('[Form1] formData.languages first item:', formData.languages[0]);
        console.log('[Form1] formData.languages first item type:', typeof formData.languages[0]);
        console.log('[Form1] formData.languages last item:', formData.languages[formData.languages.length - 1]);
        console.log('[Form1] formData.languages last item type:', typeof formData.languages[formData.languages.length - 1]);
        // Check for mixed types
        const hasStrings = formData.languages.some(lang => typeof lang === 'string');
        const hasObjects = formData.languages.some(lang => typeof lang === 'object' && lang !== null);
        console.log('[Form1] formData.languages has strings:', hasStrings);
        console.log('[Form1] formData.languages has objects:', hasObjects);
        if (hasStrings && hasObjects) {
            console.warn('[Form1] ⚠️ WARNING: formData.languages contains MIXED types (strings and objects)! This may cause rendering issues.');
        }
    }
    console.log('[Form1] activeSection:', activeSection);
    console.log('[Form1] activeSection === "languages":', activeSection === 'languages');

    // Log addLanguageInput availability and formData changes
    useEffect(() => {
        console.log('[Form1] ========== Component Effect Triggered ==========');
        console.log('[Form1] Render count:', renderCountRef.current);
        console.log('[Form1] addLanguageInput available:', typeof addLanguageInput);
        console.log('[Form1] addLanguageInput value:', addLanguageInput);
        console.log('[Form1] activeSection:', activeSection);
        console.log('[Form1] formData.languages:', formData.languages);
        console.log('[Form1] formData.languages length:', formData.languages?.length);
        console.log('[Form1] formData.languages is array:', Array.isArray(formData.languages));
        if (Array.isArray(formData.languages)) {
            console.log('[Form1] formData.languages structure:', formData.languages.map((lang, idx) => ({
                index: idx,
                type: typeof lang,
                value: lang,
                isString: typeof lang === 'string',
                isObject: typeof lang === 'object' && lang !== null
            })));
        }
        console.log('[Form1] Full formData:', formData);
        console.log('[Form1] ========== Component Effect Completed ==========');
    }, [addLanguageInput, activeSection, formData.languages, formData]);

    // Debug: Track when formData prop changes
    const prevFormDataRef = useRef(formData);
    useEffect(() => {
        const changeTimestamp = Date.now();
        console.log('[Form1] ========== formData Prop Changed ==========');
        console.log('[Form1] Change timestamp:', changeTimestamp);
        console.log('[Form1] Render count:', renderCountRef.current);
        console.log('[Form1] Previous formData.languages length:', prevFormDataRef.current?.languages?.length);
        console.log('[Form1] Current formData.languages length:', formData.languages?.length);
        console.log('[Form1] Languages length changed:', prevFormDataRef.current?.languages?.length !== formData.languages?.length);
        console.log('[Form1] Languages reference changed:', prevFormDataRef.current?.languages !== formData.languages);
        if (prevFormDataRef.current?.languages?.length !== formData.languages?.length) {
            console.log('[Form1] ✅ Languages array length changed! This should trigger a re-render.');
            console.log('[Form1] Previous languages:', prevFormDataRef.current?.languages);
            console.log('[Form1] Current languages:', formData.languages);
        }
        prevFormDataRef.current = formData;
        console.log('[Form1] New formData.languages:', formData.languages);
        console.log('[Form1] New formData.languages length:', formData.languages?.length);
        console.log('[Form1] Number of language inputs that should render:', (formData.languages || []).length);
        if (Array.isArray(formData.languages)) {
            console.log('[Form1] formData.languages detailed structure:', JSON.stringify(formData.languages, null, 2));
        }
        console.log('[Form1] ========== formData Prop Change Completed ==========');
    }, [formData]);

    // Initialize form on component mount
    useEffect(() => {
        initializeForm();
    }, [initializeForm]);

    // Normalize languages: convert strings to objects
    const normalizeLanguages = (languages) => {
        if (!Array.isArray(languages)) return [];
        return languages.map(lang => {
            if (typeof lang === 'string') {
                // Convert string to object format (no default level)
                return { name: lang, level: '' };
            } else if (typeof lang === 'object' && lang !== null && lang.name) {
                // Already an object, preserve existing level or leave empty
                return { name: lang.name, level: lang.level || '' };
            }
            // Invalid format, return default
            return { name: '', level: '' };
        });
    };

    // Normalize existing languages if they're strings (for backward compatibility)
    // No default languages - user must add them manually
    useEffect(() => {
        const currentLanguages = formData.languages || [];
        
        // Check if languages need normalization (contain strings)
        const needsNormalization = Array.isArray(currentLanguages) && 
            currentLanguages.some(lang => typeof lang === 'string');
        
        if (needsNormalization) {
            console.log('[Form1] Languages contain strings, normalizing to objects...');
            const normalizedLanguages = normalizeLanguages(currentLanguages);
            const newFormData = {
                ...formData,
                languages: normalizedLanguages
            };
            updateFormData(newFormData);
            markAsChanged();
            console.log('[Form1] Languages normalized');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync form fields with formData when it changes (e.g., when returning from preview)
    useEffect(() => {
        if (formData) {
            // Update name input
            const nameInput = document.getElementById('name-input');
            if (nameInput && nameInput.value !== (formData.name || '')) {
                nameInput.value = formData.name || '';
            }
            
            // Update position input
            const positionInput = document.getElementById('position-input');
            if (positionInput && positionInput.value !== (formData.position || '')) {
                positionInput.value = formData.position || '';
            }
            
            // Update phone input
            const phoneInput = document.getElementById('phone-input');
            if (phoneInput && phoneInput.value !== (formData.phone || '')) {
                phoneInput.value = formData.phone || '';
            }
            
            // Update email input
            const emailInput = document.getElementById('email-input');
            if (emailInput && emailInput.value !== (formData.email || '')) {
                emailInput.value = formData.email || '';
            }
            
            // Update address input
            const addressInput = document.getElementById('address-input');
            if (addressInput && addressInput.value !== (formData.address || '')) {
                addressInput.value = formData.address || '';
            }
            
            // Update professional summary
            const summaryTextarea = document.getElementById('professional-summary-textarea');
            if (summaryTextarea && summaryTextarea.value !== (formData.professionalSummary || '')) {
                summaryTextarea.value = formData.professionalSummary || '';
            }
        }
    }, [formData]);

    // Debug logs removed for cleaner console
    return (
        <div className="left-container">
            <div id="contact-info" className={`contact-info-section ${activeSection === 'contact-info' ? 'active' : ''}`}>
                <h3 className="section-title" onClick={() => toggleSection('contact-info')}>Contact Information</h3>

                <div className="file-input-container">
                    <label htmlFor="file-input" className="file-label">
                        Upload Image
                    </label>
                    <input
                        id="file-input"
                        className="file-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                                handleInputChange('profileImage', file);
                            }
                        }}
                    />
                    {/* Profile Image Preview */}
                    {(() => {
                        let imageUrl = null;
                        if (formData?.profileImage) {
                            // If it's a File object, create object URL
                            if (formData.profileImage instanceof File) {
                                imageUrl = URL.createObjectURL(formData.profileImage);
                            }
                            // If it's base64 data from database, use it directly
                            else if (formData.profileImage.data) {
                                imageUrl = formData.profileImage.data;
                            }
                            // If it's a string (direct base64 URL), use it directly
                            else if (typeof formData.profileImage === 'string') {
                                imageUrl = formData.profileImage;
                            }
                        }
                        
                        return imageUrl ? (
                            <div className="profile-image-preview-container">
                                <img 
                                    src={imageUrl} 
                                    alt="Profile Preview" 
                                    className="profile-image-preview"
                                />
                                <button
                                    type="button"
                                    className="remove-image-button"
                                    onClick={() => {
                                        handleInputChange('profileImage', null);
                                        const fileInput = document.getElementById('file-input');
                                        if (fileInput) {
                                            fileInput.value = '';
                                        }
                                    }}
                                    title="Remove Image"
                                >
                                    ×
                                </button>
                            </div>
                        ) : null;
                    })()}
                </div>

                <div className="name-input-container input-group">
                    <label htmlFor="name-input" className="name-label input-label">
                        Name
                    </label>
                    <input
                        id="name-input"
                        className="name-input styled-input"
                        type="text"
                        name="name"
                        placeholder="Enter your name"
                        value={formData.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                </div>

                <div className="position-input-container input-group">
                    <label htmlFor="position-input" className="position-label input-label">
                        Position/Title
                    </label>
                    <input
                        id="position-input"
                        className="position-input styled-input"
                        type="text"
                        name="position"
                        placeholder="Enter your position or title"
                        value={formData.position || ''}
                        onChange={(e) => handleInputChange('position', e.target.value)}
                    />
                </div>

                <div className="phone-input-container input-group">
                    <label htmlFor="phone-input" className="phone-label input-label">
                        Phone
                    </label>
                    <input
                        id="phone-input"
                        className="phone-input styled-input"
                        type="tel"
                        name="phone"
                        placeholder="Enter your phone number"
                        value={formData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                </div>

                <div className="email-input-container input-group">
                    <label htmlFor="email-input" className="email-label input-label">
                        Email
                    </label>
                    <input
                        id="email-input"
                        className="email-input styled-input"
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={formData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                </div>

                <div className="address-input-container input-group">
                    <label htmlFor="address-input" className="address-label input-label">
                        Address
                    </label>
                    <input
                        id="address-input"
                        className="address-input styled-input"
                        type="text"
                        name="address"
                        placeholder="Enter your address"
                        value={formData.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                    />
                </div>
            </div>

            <div id="professional-summary" className={`professional-summary-section ${activeSection === 'professional-summary' ? 'active' : ''}`}>
                <h3 className="section-title" onClick={() => toggleSection('professional-summary')} >Professional Summary</h3>

                <div className="professional-summary-textarea-container input-group">
                    <textarea
                        id="professional-summary-textarea"
                        className="professional-summary-textarea styled-input"
                        name="professionalSummary"
                        rows={4}
                        value={formData.professionalSummary || "To work with an organization that offers a creative, dynamic and professional environment, where my education, knowledge, skills and proven abilities can be fully utilized and which also offers learning opportunities for my career development in the long run."}
                        onChange={(e) => handleInputChange('professionalSummary', e.target.value)}
                    />
                </div>
            </div>

            <div id="education" className={`education-section ${activeSection === 'education' ? 'active' : ''}`}>
                <h3 className="section-title" onClick={() => toggleSection('education')} >Education</h3>

                {/* Render all education entries dynamically */}
                {(formData.education || []).map((edu, index) => (
                    <div key={index} className="education-group">
                        <div className="degree-input-container input-group">
                            <label htmlFor={`degree-input-${index}`} className="degree-label input-label">
                                Degree
                            </label>
                            <input
                                id={`degree-input-${index}`}
                                className="degree-input styled-input"
                                type="text"
                                name="degree"
                                placeholder="Enter your degree"
                                value={edu.degree || ''}
                                onChange={(e) => {
                                    const newEducation = [...(formData.education || [])];
                                    newEducation[index].degree = e.target.value;
                                    handleInputChange('education', newEducation);
                                }}
                            />
                        </div>

                        <div className="board-input-container input-group">
                            <label htmlFor={`board-input-${index}`} className="board-label input-label">
                                Board/University
                            </label>
                            <input
                                id={`board-input-${index}`}
                                className="board-input styled-input"
                                type="text"
                                name="board"
                                placeholder="Enter your board or university"
                                value={edu.board || ''}
                                onChange={(e) => {
                                    const newEducation = [...(formData.education || [])];
                                    newEducation[index].board = e.target.value;
                                    handleInputChange('education', newEducation);
                                }}
                            />
                        </div>

                        <div className="year-input-container input-group">
                            <label htmlFor={`year-input-${index}`} className="year-label input-label">
                                Year
                            </label>
                            <input
                                id={`year-input-${index}`}
                                className="year-input styled-input"
                                type="text"
                                name="year"
                                placeholder="Enter the year"
                                value={edu.year || ''}
                                onChange={(e) => {
                                    const newEducation = [...(formData.education || [])];
                                    newEducation[index].year = e.target.value;
                                    handleInputChange('education', newEducation);
                                }}
                            />
                        </div>

                        <div className="marks-input-container input-group">
                            <label htmlFor={`marks-input-${index}`} className="marks-label input-label">
                                Marks/CGPA
                            </label>
                            <input
                                id={`marks-input-${index}`}
                                className="marks-input styled-input"
                                type="text"
                                name="marks"
                                placeholder="Enter your marks or CGPA"
                                value={edu.marks || ''}
                                onChange={(e) => {
                                    const newEducation = [...(formData.education || [])];
                                    newEducation[index].marks = e.target.value;
                                    handleInputChange('education', newEducation);
                                }}
                            />
                        </div>

                        {/* Remove button for each education entry */}
                        {index > 0 && (
                            <div className="remove-education-container">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        const newEducation = [...(formData.education || [])];
                                        newEducation.splice(index, 1);
                                        handleInputChange('education', newEducation);
                                    }} 
                                    className="remove-education-button"
                                >
                                    Remove Education
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                <div className="add-education-container">
                    <button type="button" onClick={() => {
                        const newEducation = [...(formData.education || [])];
                        newEducation.push({ degree: '', board: '', year: '', marks: '' });
                        handleInputChange('education', newEducation);
                    }} className="add-education-button">
                        Add Education
                    </button>
                </div>
            </div>

            <div id="experience" className={`experience-section ${activeSection === 'experience' ? 'active' : ''}`}>
                <h3 className="section-title" onClick={() => toggleSection('experience')} >Experience</h3>

                {/* Render all experience entries dynamically */}
                {(formData.experience || []).map((exp, index) => (
                    <div key={index} className="experience-group">
                        <div className="job-title-input-container input-group">
                            <label htmlFor={`job-title-input-${index}`} className="job-title-label input-label">
                                Job Title
                            </label>
                            <input
                                id={`job-title-input-${index}`}
                                className="job-title-input styled-input"
                                type="text"
                                name="jobTitle"
                                placeholder="Enter your job title"
                                value={exp.jobTitle || ''}
                                onChange={(e) => {
                                    const newExperience = [...(formData.experience || [])];
                                    newExperience[index].jobTitle = e.target.value;
                                    handleInputChange('experience', newExperience);
                                }}
                            />
                        </div>

                        <div className="company-input-container input-group">
                            <label htmlFor={`company-input-${index}`} className="company-label input-label">
                                Company
                            </label>
                            <input
                                id={`company-input-${index}`}
                                className="company-input styled-input"
                                type="text"
                                name="company"
                                placeholder="Enter your company"
                                value={exp.company || ''}
                                onChange={(e) => {
                                    const newExperience = [...(formData.experience || [])];
                                    newExperience[index].company = e.target.value;
                                    handleInputChange('experience', newExperience);
                                }}
                            />
                        </div>

                        <div className="duration-input-container input-group">
                            <label htmlFor={`duration-input-${index}`} className="duration-label input-label">
                                Duration
                            </label>
                            <input
                                id={`duration-input-${index}`}
                                className="duration-input styled-input"
                                type="text"
                                name="duration"
                                placeholder="Enter the duration"
                                value={exp.duration || ''}
                                onChange={(e) => {
                                    const newExperience = [...(formData.experience || [])];
                                    newExperience[index].duration = e.target.value;
                                    handleInputChange('experience', newExperience);
                                }}
                            />
                        </div>

                        <div className="job-details-input-container input-group">
                            <label htmlFor={`job-details-textarea-${index}`} className="job-details-label input-label">
                                Job Details
                            </label>
                            <textarea
                                id={`job-details-textarea-${index}`}
                                className="job-details-textarea styled-input"
                                name="jobDetails"
                                placeholder="Enter details about your job"
                                rows={2}
                                value={exp.jobDetails || ''}
                                onChange={(e) => {
                                    const newExperience = [...(formData.experience || [])];
                                    newExperience[index].jobDetails = e.target.value;
                                    handleInputChange('experience', newExperience);
                                }}
                            />
                        </div>

                        {/* Remove button for each experience entry */}
                        {index > 0 && (
                            <div className="remove-experience-container">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        const newExperience = [...(formData.experience || [])];
                                        newExperience.splice(index, 1);
                                        handleInputChange('experience', newExperience);
                                    }} 
                                    className="remove-experience-button"
                                >
                                    Remove Experience
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                <div className="add-experience-container">
                    <button type="button" onClick={() => {
                        const newExperience = [...(formData.experience || [])];
                        newExperience.push({ jobTitle: '', company: '', duration: '', jobDetails: '' });
                        handleInputChange('experience', newExperience);
                    }} className="add-experience-button">
                        Add Experience
                    </button>
                </div>
            </div>

            <div id="certifications" className={`certifications-section ${activeSection === 'certifications' ? 'active' : ''}`}>
                <h3 className="section-title" onClick={() => toggleSection('certifications')} >Certifications</h3>

                {formData.certifications && formData.certifications.map((certification, index) => (
                    <div key={index} className="certification-input-container input-group">
                        <div className="certification-input-wrapper">
                            <input
                                id={`certification-input-${index}`}
                                className="certification-input styled-input"
                                type="text"
                                name="certification"
                                placeholder="Enter a certification"
                                value={certification}
                                onChange={(e) => {
                                    const newCertifications = [...(formData.certifications || [])];
                                    newCertifications[index] = e.target.value;
                                    handleInputChange('certifications', newCertifications);
                                }}
                            />
                            <button 
                                type="button" 
                                className="remove-certification-button"
                                onClick={() => {
                                    const newCertifications = [...(formData.certifications || [])];
                                    newCertifications.splice(index, 1);
                                    handleInputChange('certifications', newCertifications);
                                }}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}

                <div className="add-certification-container">
                    <button type="button" onClick={addCertificationInput} className="add-certification-button">
                        Add Certification
                    </button>
                </div>
            </div>

            <div id="skills" className={`skills-section ${activeSection === 'skills' ? 'active' : ''}`}>
                <h3 className="section-title" onClick={() => toggleSection('skills')} >Skills</h3>

                {formData.skills && formData.skills.map((skill, index) => (
                    <div key={index} className="skill-input-container input-group">
                        <div className="skill-input-wrapper">
                            <input
                                id={`skill-input-${index}`}
                                className="skill-input styled-input"
                                type="text"
                                name="skill"
                                placeholder="Enter a skill"
                                value={skill}
                                onChange={(e) => {
                                    const newSkills = [...(formData.skills || [])];
                                    newSkills[index] = e.target.value;
                                    // Filter out empty skills
                                    const filteredSkills = newSkills.filter(skill => skill && skill.trim() !== '');
                                    handleInputChange('skills', filteredSkills);
                                }}
                            />
                            <button 
                                type="button" 
                                className="remove-skill-button"
                                onClick={() => {
                                    const newSkills = [...(formData.skills || [])];
                                    newSkills.splice(index, 1);
                                    // Filter out empty skills
                                    const filteredSkills = newSkills.filter(skill => skill && skill.trim() !== '');
                                    handleInputChange('skills', filteredSkills);
                                }}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}


                <div className="add-skill-container">
                    <button type="button" onClick={addSkillInput} className="add-skill-button">
                        Add Skill
                    </button>
                </div>

            </div>

            <div id="other-information" className={`other-information-section ${activeSection === 'other-information' ? 'active' : ''}`}>
                <h3 className="section-title" onClick={() => toggleSection('other-information')} >Other Information</h3>


                {/* Always visible input fields for users to start entering data */}
                <div className="father-name-input-container input-group">
                    <label htmlFor="father-name-input-always" className="father-name-label input-label">
                        Father's Name
                    </label>
                    <input
                        id="father-name-input-always"
                        className="father-name-input styled-input"
                        type="text"
                        name="fatherNameAlways"
                        placeholder="Enter father's name"
                        value={formData.otherInfo?.find(info => info.label === "Father's Name")?.value || ''}
                        onChange={(e) => {
                            const newOtherInfo = [...(formData.otherInfo || [])];
                            const existingIndex = newOtherInfo.findIndex(info => info.label === "Father's Name");
                            if (existingIndex >= 0) {
                                newOtherInfo[existingIndex].value = e.target.value;
                            } else {
                                newOtherInfo.push({ label: "Father's Name", value: e.target.value });
                            }
                            handleInputChange('otherInfo', newOtherInfo);
                        }}
                    />
                </div>

                <div className="husband-name-input-container input-group">
                    <label htmlFor="husband-name-input-always" className="husband-name-label input-label">
                        Husband's Name
                    </label>
                    <input
                        id="husband-name-input-always"
                        className="husband-name-input styled-input"
                        type="text"
                        name="husbandNameAlways"
                        placeholder="Enter husband's name"
                        value={formData.otherInfo?.find(info => info.label === "Husband's Name")?.value || ''}
                        onChange={(e) => {
                            const newOtherInfo = [...(formData.otherInfo || [])];
                            const existingIndex = newOtherInfo.findIndex(info => info.label === "Husband's Name");
                            if (existingIndex >= 0) {
                                newOtherInfo[existingIndex].value = e.target.value;
                            } else {
                                newOtherInfo.push({ label: "Husband's Name", value: e.target.value });
                            }
                            handleInputChange('otherInfo', newOtherInfo);
                        }}
                    />
                </div>

                <div className="cnic-input-container input-group">
                    <label htmlFor="cnic-input-always" className="cnic-label input-label">
                        CNIC
                    </label>
                    <input
                        id="cnic-input-always"
                        className="cnic-input styled-input"
                        type="text"
                        name="cnicAlways"
                        placeholder="Enter CNIC number"
                        value={formData.otherInfo?.find(info => info.label === "CNIC")?.value || ''}
                        onChange={(e) => {
                            const newOtherInfo = [...(formData.otherInfo || [])];
                            const existingIndex = newOtherInfo.findIndex(info => info.label === "CNIC");
                            if (existingIndex >= 0) {
                                newOtherInfo[existingIndex].value = e.target.value;
                            } else {
                                newOtherInfo.push({ label: "CNIC", value: e.target.value });
                            }
                            handleInputChange('otherInfo', newOtherInfo);
                        }}
                    />
                </div>

                <div className="dob-input-container input-group">
                    <label htmlFor="dob-input-always" className="dob-label input-label">
                        Date of Birth
                    </label>
                    <input
                        id="dob-input-always"
                        className="dob-input styled-input"
                        type="text"
                        name="dateOfBirthAlways"
                        placeholder="Enter date of birth"
                        value={formData.otherInfo?.find(info => info.label === "Date of Birth")?.value || ''}
                        onChange={(e) => {
                            const newOtherInfo = [...(formData.otherInfo || [])];
                            const existingIndex = newOtherInfo.findIndex(info => info.label === "Date of Birth");
                            if (existingIndex >= 0) {
                                newOtherInfo[existingIndex].value = e.target.value;
                            } else {
                                newOtherInfo.push({ label: "Date of Birth", value: e.target.value });
                            }
                            handleInputChange('otherInfo', newOtherInfo);
                        }}
                    />
                </div>

                <div className="marital-status-input-container input-group">
                    <label htmlFor="marital-status-input-always" className="marital-status-label input-label">
                        Marital Status
                    </label>
                    <input
                        id="marital-status-input-always"
                        className="marital-status-input styled-input"
                        type="text"
                        name="maritalStatusAlways"
                        placeholder="Enter marital status"
                        value={formData.otherInfo?.find(info => info.label === "Marital Status")?.value || ''}
                        onChange={(e) => {
                            const newOtherInfo = [...(formData.otherInfo || [])];
                            const existingIndex = newOtherInfo.findIndex(info => info.label === "Marital Status");
                            if (existingIndex >= 0) {
                                newOtherInfo[existingIndex].value = e.target.value;
                            } else {
                                newOtherInfo.push({ label: "Marital Status", value: e.target.value });
                            }
                            handleInputChange('otherInfo', newOtherInfo);
                        }}
                    />
                </div>

                <div className="religion-input-container input-group">
                    <label htmlFor="religion-input-always" className="religion-label input-label">
                        Religion
                    </label>
                    <input
                        id="religion-input-always"
                        className="religion-input styled-input"
                        type="text"
                        name="religionAlways"
                        placeholder="Enter religion"
                        value={formData.otherInfo?.find(info => info.label === "Religion")?.value || ''}
                        onChange={(e) => {
                            const newOtherInfo = [...(formData.otherInfo || [])];
                            const existingIndex = newOtherInfo.findIndex(info => info.label === "Religion");
                            if (existingIndex >= 0) {
                                newOtherInfo[existingIndex].value = e.target.value;
                            } else {
                                newOtherInfo.push({ label: "Religion", value: e.target.value });
                            }
                            handleInputChange('otherInfo', newOtherInfo);
                        }}
                    />
                </div>

                {/* Custom information fields - only show non-standard fields */}
                {formData.otherInfo && formData.otherInfo
                    .map((info, originalIndex) => ({ info, originalIndex }))
                    .filter(({ info }) => !['Father\'s Name', 'Husband\'s Name', 'CNIC', 'Date of Birth', 'Marital Status', 'Religion'].includes(info.label))
                    .map(({ info, originalIndex }, displayIndex) => (
                    <div key={originalIndex} className="custom-info-container input-group">
                        <div className="custom-info-wrapper">
                            <div className="custom-label-input">
                                <label htmlFor={`custom-label-${originalIndex}`} className="custom-label">Label:</label>
                                <input
                                    id={`custom-label-${originalIndex}`}
                                    className="custom-label-input-field styled-input"
                                    type="text"
                                    name="customLabel"
                                    placeholder="Enter label"
                                    value={info.label || ''}
                                    onChange={(e) => {
                                        const newOtherInfo = [...(formData.otherInfo || [])];
                                        newOtherInfo[originalIndex].label = e.target.value;
                                        handleInputChange('otherInfo', newOtherInfo);
                                    }}
                                />
                            </div>
                            <div className="custom-value-input">
                                <label htmlFor={`custom-value-${originalIndex}`} className="custom-label">Value:</label>
                                <input
                                    id={`custom-value-${originalIndex}`}
                                    className="custom-value-input-field styled-input"
                                    type="text"
                                    name="customValue"
                                    placeholder="Enter value"
                                    value={info.value || ''}
                                    onChange={(e) => {
                                        const newOtherInfo = [...(formData.otherInfo || [])];
                                        newOtherInfo[originalIndex].value = e.target.value;
                                        handleInputChange('otherInfo', newOtherInfo);
                                    }}
                                />
                            </div>
                            <button 
                                type="button" 
                                className="remove-custom-button"
                                onClick={() => {
                                    const newOtherInfo = [...(formData.otherInfo || [])];
                                    newOtherInfo.splice(originalIndex, 1);
                                    handleInputChange('otherInfo', newOtherInfo);
                                }}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}

                <div className="add-information-container">
                    <button type="button" onClick={addCustomInformation} className="add-information-button">
                        Add Information
                    </button>
                </div>
            </div>

            <div id="hobbies" className={`hobbies-section ${activeSection === 'hobbies' ? 'active' : ''}`}>
                <h3 className="section-title" onClick={() => toggleSection('hobbies')} >Hobbies</h3>

                {formData.hobbies && formData.hobbies.map((hobby, index) => (
                    <div key={index} className="hobby-input-container input-group">
                        <div className="hobby-input-wrapper">
                            <input
                                id={`hobby-input-${index}`}
                                className="hobby-input styled-input"
                                type="text"
                                name="hobby"
                                placeholder="Enter a hobby"
                                value={hobby}
                                onChange={(e) => {
                                    const newHobbies = [...(formData.hobbies || [])];
                                    newHobbies[index] = e.target.value;
                                    handleInputChange('hobbies', newHobbies);
                                }}
                            />
                            {index > 0 && (
                                <button 
                                    type="button" 
                                    className="remove-hobby-button"
                                    onClick={() => {
                                        const newHobbies = formData.hobbies.filter((_, i) => i !== index);
                                        handleInputChange('hobbies', newHobbies);
                                    }}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                <div className="add-hobby-container">
                    <button type="button" onClick={addHobbyInput} className="add-hobby-button">
                        Add Hobby
                    </button>
                </div>
            </div>

            <div id="languages" className={`languages-section ${activeSection === 'languages' ? 'active' : ''}`}>
                <h3 className="section-title" onClick={() => {
                    console.log('[Form1] Languages section title clicked');
                    console.log('[Form1] Current activeSection:', activeSection);
                    console.log('[Form1] Calling toggleSection("languages")...');
                    toggleSection('languages');
                    console.log('[Form1] toggleSection("languages") called');
                }} >Languages</h3>

                {(() => {
                    console.log('[Form1] ========== Languages Section Rendering ==========');
                    console.log('[Form1] Render count:', renderCountRef.current);
                    console.log('[Form1] activeSection:', activeSection);
                    console.log('[Form1] activeSection === "languages":', activeSection === 'languages');
                    console.log('[Form1] Section will be visible:', activeSection === 'languages');
                    console.log('[Form1] Current formData:', formData);
                    console.log('[Form1] Current formData.languages:', formData.languages);
                    const languagesArray = formData.languages || [];
                    console.log('[Form1] languagesArray:', languagesArray);
                    console.log('[Form1] languagesArray length:', languagesArray.length);
                    console.log('[Form1] languagesArray is array:', Array.isArray(languagesArray));
                    console.log('[Form1] languagesArray type:', typeof languagesArray);
                    if (Array.isArray(languagesArray)) {
                        console.log('[Form1] languagesArray structure:', languagesArray.map((lang, idx) => ({
                            index: idx,
                            type: typeof lang,
                            value: lang,
                            isString: typeof lang === 'string',
                            isObject: typeof lang === 'object' && lang !== null,
                            name: typeof lang === 'object' && lang !== null ? lang.name : (typeof lang === 'string' ? lang : 'N/A')
                        })));
                    }
                    console.log('[Form1] About to map over languagesArray...');
                    const mappedResult = languagesArray.map((language, index) => {
                        // Handle both string and object formats
                        const languageName = typeof language === 'string' ? language : (language.name || '');
                        const languageLevel = typeof language === 'string' ? '' : (language.level || '');
                        console.log(`[Form1] Rendering language ${index}:`, { languageName, languageLevel, language });
                        
                        return (
                            <div key={index} className="language-input-container input-group">
                            <div className="language-input-wrapper">
                                <input
                                    id={`language-input-${index}`}
                                    className="language-input styled-input"
                                    type="text"
                                    name="language"
                                    placeholder="Enter a language"
                                    value={languageName}
                                    onChange={(e) => {
                                        console.log('[Form1] Language name input changed');
                                        console.log('[Form1] Input value:', e.target.value);
                                        console.log('[Form1] Index:', index);
                                        console.log('[Form1] Current formData.languages:', formData.languages);
                                        const newLanguages = [...(formData.languages || [])];
                                        // Ensure we're working with object format
                                        const currentLang = typeof newLanguages[index] === 'string' 
                                            ? { name: newLanguages[index], level: '' }
                                            : (newLanguages[index] || { name: '', level: '' });
                                        newLanguages[index] = { ...currentLang, name: e.target.value };
                                        console.log('[Form1] Updated newLanguages:', newLanguages);
                                        console.log('[Form1] Calling handleInputChange("languages", ...)');
                                        handleInputChange('languages', newLanguages);
                                    }}
                                />
                                <input
                                    id={`language-level-input-${index}`}
                                    className="language-level-input styled-input"
                                    type="text"
                                    name="language-level"
                                    placeholder="Level (e.g., Proficient)"
                                    value={languageLevel}
                                    onChange={(e) => {
                                        const newLanguages = [...(formData.languages || [])];
                                        // Ensure we're working with object format
                                        const currentLang = typeof newLanguages[index] === 'string' 
                                            ? { name: newLanguages[index], level: '' }
                                            : (newLanguages[index] || { name: '', level: '' });
                                        newLanguages[index] = { ...currentLang, level: e.target.value };
                                        handleInputChange('languages', newLanguages);
                                    }}
                                    style={{ width: '150px', flexShrink: 0 }}
                                />
                                <button 
                                    type="button" 
                                    className="remove-language-button"
                                    onClick={() => {
                                        const newLanguages = [...(formData.languages || [])];
                                        newLanguages.splice(index, 1);
                                        handleInputChange('languages', newLanguages);
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                        );
                    });
                    console.log('[Form1] Mapped result length:', mappedResult.length);
                    console.log('[Form1] Mapped result:', mappedResult);
                    console.log('[Form1] ========== Languages Section Rendering Completed ==========');
                    
                    // Check DOM after render
                    setTimeout(() => {
                        const languagesSection = document.getElementById('languages');
                        const languageInputs = document.querySelectorAll('#languages .language-input');
                        console.log('[Form1] ========== DOM Check (after render) ==========');
                        console.log('[Form1] languages section element:', languagesSection);
                        console.log('[Form1] languages section classes:', languagesSection?.className);
                        console.log('[Form1] languages section has "active" class:', languagesSection?.classList.contains('active'));
                        console.log('[Form1] Number of language input elements found:', languageInputs.length);
                        console.log('[Form1] Language input elements:', Array.from(languageInputs).map((el, idx) => ({
                            index: idx,
                            id: el.id,
                            value: el.value,
                            visible: el.offsetParent !== null,
                            display: window.getComputedStyle(el).display,
                            visibility: window.getComputedStyle(el).visibility
                        })));
                        console.log('[Form1] ========== DOM Check Completed ==========');
                    }, 100);
                    
                    return mappedResult;
                })()}

                <div className="add-language-container">
                    <button 
                        type="button" 
                        onClick={() => {
                            console.log('[Form1] Add Language button clicked');
                            
                            // Ensure languages section is active/expanded so the input will be visible
                            if (activeSection !== 'languages') {
                                toggleSection('languages');
                            }
                            
                            // Add a new language input directly
                            const currentLanguages = formData.languages || [];
                            console.log('[Form1] Current languages count:', currentLanguages.length);
                            const newLanguage = { name: '', level: '' };
                            const newLanguages = [...currentLanguages, newLanguage];
                            console.log('[Form1] New languages count:', newLanguages.length);
                            handleInputChange('languages', newLanguages);
                            console.log('[Form1] Language added successfully');
                        }} 
                        className="add-language-button"
                    >
                        Add Language
                    </button>
                </div>
            </div>

            <div id="custom-section" className={`custom-section ${activeSection === 'custom-section' ? 'active' : ''}`}>
                <h3 className="section-title" onClick={() => toggleSection('custom-section')} >Custom Section</h3>

                {/* Render all custom sections */}
                {formData.customSection && formData.customSection.length > 0 && formData.customSection.map((custom, sectionIndex) => {
                    // Handle both old format (with 'detail') and new format (with 'details' array)
                    const details = custom.details || (custom.detail ? [custom.detail] : ['']);
                    
                    return (
                        <div key={sectionIndex} className="custom-section-group">
                            <div className="custom-section-heading-input-container input-group">
                                <label htmlFor={`custom-section-heading-input-${sectionIndex}`} className="custom-section-heading-label input-label">
                                    Custom Section Heading {sectionIndex > 0 ? `#${sectionIndex + 1}` : ''}
                                </label>
                                <div className="custom-section-heading-wrapper">
                                    <input
                                        id={`custom-section-heading-input-${sectionIndex}`}
                                        className="custom-section-heading-input styled-input"
                                        type="text"
                                        name="customSectionHeading"
                                        placeholder="Enter custom section heading"
                                        value={custom.heading || ''}
                                        onChange={(e) => {
                                            const heading = e.target.value;
                                            const newCustomSection = [...(formData.customSection || [])];
                                            const currentDetails = newCustomSection[sectionIndex]?.details || (newCustomSection[sectionIndex]?.detail ? [newCustomSection[sectionIndex].detail] : ['']);
                                            newCustomSection[sectionIndex] = { heading, details: currentDetails };
                                            handleInputChange('customSection', newCustomSection);
                                        }}
                                    />
                                    {sectionIndex > 0 && (
                                        <button 
                                            type="button" 
                                            className="remove-section-button"
                                            onClick={() => {
                                                const newCustomSection = [...(formData.customSection || [])];
                                                newCustomSection.splice(sectionIndex, 1);
                                                handleInputChange('customSection', newCustomSection);
                                            }}
                                        >
                                            Remove Section
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Render all details for this section */}
                            <div className="custom-section-details-container">
                                <label className="input-label">Custom Section Details</label>
                                {details.map((detail, detailIndex) => (
                                    <div key={detailIndex} className="custom-detail-container input-group">
                                        <div className="custom-detail-wrapper">
                                            <input
                                                id={`custom-detail-input-${sectionIndex}-${detailIndex}`}
                                                className="custom-detail-input styled-input"
                                                type="text"
                                                name="customDetail"
                                                placeholder="Enter custom section detail"
                                                value={detail || ''}
                                                onChange={(e) => {
                                                    const newCustomSection = [...(formData.customSection || [])];
                                                    const currentDetails = newCustomSection[sectionIndex]?.details || (newCustomSection[sectionIndex]?.detail ? [newCustomSection[sectionIndex].detail] : ['']);
                                                    currentDetails[detailIndex] = e.target.value;
                                                    newCustomSection[sectionIndex] = { 
                                                        ...newCustomSection[sectionIndex], 
                                                        heading: newCustomSection[sectionIndex]?.heading || '',
                                                        details: currentDetails 
                                                    };
                                                    handleInputChange('customSection', newCustomSection);
                                                }}
                                            />
                                            {detailIndex > 0 && (
                                                <button 
                                                    type="button" 
                                                    className="remove-detail-button"
                                                    onClick={() => {
                                                        const newCustomSection = [...(formData.customSection || [])];
                                                        const currentDetails = newCustomSection[sectionIndex]?.details || (newCustomSection[sectionIndex]?.detail ? [newCustomSection[sectionIndex].detail] : ['']);
                                                        currentDetails.splice(detailIndex, 1);
                                                        newCustomSection[sectionIndex] = { 
                                                            ...newCustomSection[sectionIndex], 
                                                            heading: newCustomSection[sectionIndex]?.heading || '',
                                                            details: currentDetails 
                                                        };
                                                        handleInputChange('customSection', newCustomSection);
                                                    }}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Add Details button for this section */}
                                <div className="add-detail-container">
                                    <button 
                                        type="button" 
                                        onClick={() => addCustomSectionDetail(sectionIndex)} 
                                        className="add-detail-button"
                                    >
                                        Add Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* If no custom sections exist, initialize with one */}
                {(!formData.customSection || formData.customSection.length === 0) && (
                    <div className="custom-section-group">
                        <div className="custom-section-heading-input-container input-group">
                            <label htmlFor="custom-section-heading-input-0" className="custom-section-heading-label input-label">
                                Custom Section Heading
                            </label>
                            <input
                                id="custom-section-heading-input-0"
                                className="custom-section-heading-input styled-input"
                                type="text"
                                name="customSectionHeading"
                                placeholder="Enter custom section heading"
                                value=""
                                onChange={(e) => {
                                    const heading = e.target.value;
                                    handleInputChange('customSection', [{ heading, details: [''] }]);
                                }}
                            />
                        </div>
                        <div className="custom-section-details-container">
                            <label className="input-label">Custom Section Details</label>
                            <div className="custom-detail-container input-group">
                                <input
                                    id="custom-detail-input-0-0"
                                    className="custom-detail-input styled-input"
                                    type="text"
                                    name="customDetail"
                                    placeholder="Enter custom section detail"
                                    value=""
                                    onChange={(e) => {
                                        handleInputChange('customSection', [{ heading: '', details: [e.target.value] }]);
                                    }}
                                />
                            </div>
                            <div className="add-detail-container">
                                <button 
                                    type="button" 
                                    onClick={() => addCustomSectionDetail(0)} 
                                    className="add-detail-button"
                                >
                                    Add Details
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Section button */}
                <div className="add-section-container">
                    <button type="button" onClick={addCustomSection} className="add-section-button">
                        Add Section
                    </button>
                </div>
            </div>

            <div id="references" className={`references-section ${activeSection === 'references' ? 'active' : ''}`}>
                <h3 className="section-title" onClick={() => toggleSection('references')}>References</h3>

                <div className="reference-input-container input-group">
                    <input
                        id="reference-input"
                        className="reference-input styled-input"
                        type="text"
                        name="reference"
                        placeholder="References would be furnished on demand."
                        value={referenceText}
                        onChange={handleReferenceChange}
                    />
                </div>

                <div className="add-reference-container">
                    <button type="button" onClick={addReferenceInput} className="add-reference-button">
                        Add Reference
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Form;
