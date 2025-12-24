import React, { useEffect } from 'react';
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
        activeSection,
        languagesCleared,
        setLanguagesCleared
    } = useFormHandler(formData, updateFormData, markAsChanged);

    // Initialize form on component mount
    useEffect(() => {
        initializeForm();
    }, [initializeForm]);

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

            <div id="languages" className={`languages-section ${activeSection === 'languages' ? 'active' : ''}`}>
                <h3 className="section-title" onClick={() => toggleSection('languages')} >Languages</h3>

                {/* Render all language inputs dynamically */}
                {(() => {
                    // If languages have been explicitly cleared by user, don't show fallback
                    if (languagesCleared && (!formData.languages || formData.languages.length === 0)) {
                        return [];
                    }
                    // Otherwise show current languages or default fallback
                    return (formData.languages && formData.languages.length > 0 ? formData.languages : ['English', 'Urdu', 'Punjabi']);
                })().map((language, index) => (
                    <div key={index} className="language-input-container input-group">
                        <div className="language-input-wrapper">
                            <input
                                id={`language-input-${index}`}
                                className="language-input styled-input"
                                type="text"
                                name="language"
                                placeholder="Enter a language"
                                value={language}
                                onChange={(e) => {
                                    const newLanguages = [...(formData.languages || [])];
                                    newLanguages[index] = e.target.value;
                                    // Filter out empty languages
                                    const filteredLanguages = newLanguages.filter(lang => lang && lang.trim() !== '');
                                    
                                    // If all languages are cleared, mark as cleared
                                    if (filteredLanguages.length === 0) {
                                        setLanguagesCleared(true);
                                    }
                                    
                                    handleInputChange('languages', filteredLanguages);
                                }}
                            />
                            <button 
                                type="button" 
                                className="remove-language-button"
                                onClick={() => {
                                    const newLanguages = [...(formData.languages || [])];
                                    newLanguages.splice(index, 1);
                                    
                                    // If all languages are removed, mark as cleared
                                    if (newLanguages.length === 0) {
                                        setLanguagesCleared(true);
                                    }
                                    
                                    handleInputChange('languages', newLanguages);
                                }}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}

                <div className="add-language-container">
                    <button type="button" onClick={() => {
                        setLanguagesCleared(false); // Reset cleared state when adding language
                        addLanguageInput();
                    }} className="add-language-button">
                        Add Language
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
