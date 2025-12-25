import React, { useEffect, useState, useRef } from 'react';
import usePreviewHandler from './PreviewHandler2';
import generatePDF from './pdf2';
import './Preview2.css';

// Function to capture all form data from DOM (similar to PreviewHandler2.getFormData)
// Takes existingFormData parameter to preserve profileImage from database
const getFormDataFromDOM = (existingFormData = null) => {
  // Get profileImage - prefer existing one (from database) if available, otherwise get from file input
  let profileImage = null;
  if (existingFormData?.profileImage) {
    // If existing profileImage is from database (has .data property), preserve it
    if (existingFormData.profileImage.data) {
      profileImage = existingFormData.profileImage;
    } else if (existingFormData.profileImage instanceof File) {
      profileImage = existingFormData.profileImage;
    }
  }
  // If no existing profileImage or it's not from database, try to get from file input
  if (!profileImage) {
    profileImage = document.getElementById('file-input')?.files?.[0] || null;
  }
  
  const data = {
    name: document.getElementById('name-input')?.value || '',
    position: document.getElementById('position-input')?.value || '',
    phone: document.getElementById('phone-input')?.value || '',
    email: document.getElementById('email-input')?.value || '',
    address: document.getElementById('address-input')?.value || '',
    profileImage: profileImage,
    professionalSummary: document.getElementById('professional-summary-textarea')?.value || '',
    education: [],
    experience: [],
    skills: [],
    certifications: [],
    languages: [],
    hobbies: [],
    otherInfo: [],
    customSection: [],
    references: []
  };

  // Get education data
  const mainDegree = document.getElementById('degree-input')?.value || '';
  const mainBoard = document.getElementById('board-input')?.value || '';
  const mainYear = document.getElementById('year-input')?.value || '';
  const mainMarks = document.getElementById('marks-input')?.value || '';
  
  let educationData = [];
  if (mainDegree.trim() || mainBoard.trim() || mainYear.trim() || mainMarks.trim()) {
    educationData.push({ degree: mainDegree, board: mainBoard, year: mainYear, marks: mainMarks });
  }
  
  const educationGroups = document.querySelectorAll('.education-group');
  educationData = educationData.concat(Array.from(educationGroups).map(group => {
    const degree = group.querySelector('.degree-input')?.value || '';
    const board = group.querySelector('.board-input')?.value || '';
    const year = group.querySelector('.year-input')?.value || '';
    const marks = group.querySelector('.marks-input')?.value || '';
    if (degree.trim() || board.trim() || year.trim() || marks.trim()) {
      return { degree, board, year, marks };
    }
    return null;
  }).filter(edu => edu !== null));
  data.education = educationData;

  // Get experience data
  const mainJobTitle = document.getElementById('job-title-input')?.value || '';
  const mainCompany = document.getElementById('company-input')?.value || '';
  const mainDuration = document.getElementById('duration-input')?.value || '';
  const mainJobDetails = document.getElementById('job-details-textarea')?.value || '';
  
  let experienceData = [];
  if (mainJobTitle.trim() || mainCompany.trim() || mainDuration.trim() || mainJobDetails.trim()) {
    experienceData.push({ jobTitle: mainJobTitle, company: mainCompany, duration: mainDuration, jobDetails: mainJobDetails });
  }
  
  const experienceGroups = document.querySelectorAll('.experience-group');
  experienceData = experienceData.concat(Array.from(experienceGroups).map(group => {
    const jobTitle = group.querySelector('.job-title-input')?.value || '';
    const company = group.querySelector('.company-input')?.value || '';
    const duration = group.querySelector('.duration-input')?.value || '';
    const jobDetails = group.querySelector('.job-details-textarea')?.value || '';
    if (jobTitle.trim() || company.trim() || duration.trim() || jobDetails.trim()) {
      return { jobTitle, company, duration, jobDetails };
    }
    return null;
  }).filter(exp => exp !== null));
  data.experience = experienceData;

  // Get skills, certifications, languages, references
  const skillInputs = document.querySelectorAll('.skills-section input[type="text"]');
  data.skills = Array.from(skillInputs).map(input => input.value).filter(value => value.trim() !== '');

  const certInputs = document.querySelectorAll('.certifications-section input[type="text"]');
  data.certifications = Array.from(certInputs).map(input => input.value).filter(value => value.trim() !== '');

  const langInputs = document.querySelectorAll('.languages-section input[type="text"]');
  data.languages = Array.from(langInputs).map(input => input.value).filter(value => value.trim() !== '');

  const refInputs = document.querySelectorAll('.references-section input[type="text"]');
  data.references = Array.from(refInputs).map(input => input.value).filter(value => value.trim() !== '');

  const hobbyInputs = document.querySelectorAll('.hobbies-section input[type="text"]');
  data.hobbies = Array.from(hobbyInputs).map(input => input.value).filter(value => value.trim() !== '');

  // Get other information
  const otherInfoData = [];
  const fatherName = document.getElementById('father-name-input-always')?.value || '';
  const husbandName = document.getElementById('husband-name-input-always')?.value || '';
  const cnic = document.getElementById('cnic-input-always')?.value || '';
  const dob = document.getElementById('dob-input-always')?.value || '';
  const maritalStatus = document.getElementById('marital-status-input-always')?.value || '';
  const religion = document.getElementById('religion-input-always')?.value || '';
  
  if (fatherName.trim()) otherInfoData.push({ label: "Father's Name", value: fatherName });
  if (husbandName.trim()) otherInfoData.push({ label: "Husband's Name", value: husbandName });
  if (cnic.trim()) otherInfoData.push({ label: "CNIC", value: cnic });
  if (dob.trim()) otherInfoData.push({ label: "Date of Birth", value: dob });
  if (maritalStatus.trim()) otherInfoData.push({ label: "Marital Status", value: maritalStatus });
  if (religion.trim()) otherInfoData.push({ label: "Religion", value: religion });
  
  const customInfoGroups = document.querySelectorAll('.custom-info-wrapper');
  customInfoGroups.forEach(group => {
    const labelInput = group.querySelector('.custom-label-input-field');
    const valueInput = group.querySelector('.custom-value-input-field');
    if (labelInput?.value.trim() && valueInput?.value.trim()) {
      otherInfoData.push({ label: labelInput.value, value: valueInput.value });
    }
  });
  data.otherInfo = otherInfoData;

  // Get custom section
  const customSectionHeading = document.getElementById('custom-section-heading-input')?.value || '';
  const customSectionDetail = document.getElementById('custom-section-detail-input')?.value || '';
  let customSectionData = [];
  if (customSectionHeading.trim() || customSectionDetail.trim()) {
    customSectionData.push({ heading: customSectionHeading, detail: customSectionDetail });
  }
  const customDetailInputs = document.querySelectorAll('.custom-detail-input');
  customDetailInputs.forEach(input => {
    const detail = input.value.trim();
    if (detail) {
      customSectionData.push({ heading: '', detail: detail });
    }
  });
  data.customSection = customSectionData;

  return data;
};

function Preview2({ formData: propFormData, autoSaveStatus, hasUnsavedChanges, isPreviewPage, updateFormData }) {
  const [showA4Preview, setShowA4Preview] = useState(false);
  const [a4Scale, setA4Scale] = useState(1);
  const a4PreviewRef = useRef(null);
  const { formData: hookFormData, formatContactInfo, updatePreviewData } = usePreviewHandler(propFormData);
  
  // Use hookFormData as primary source (it merges propFormData with DOM data in PreviewHandler2)
  // This ensures we get all data whether from app state or DOM
  // If hookFormData is empty or doesn't have data, check localStorage and propFormData
  let formData = hookFormData;
  
  // If hookFormData is empty, try localStorage
  if (!formData || (!formData.name && !formData.education?.length && !formData.experience?.length)) {
    const storedData = localStorage.getItem('cvFormData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        console.log('Preview2 - Using stored data from localStorage:', parsedData);
        // Preserve profileImage from propFormData if it exists and is from database
        if (propFormData?.profileImage && propFormData.profileImage.data) {
          parsedData.profileImage = propFormData.profileImage;
          console.log('Preview2 - Preserved profileImage from propFormData:', parsedData.profileImage);
        }
        formData = parsedData;
      } catch (e) {
        console.error('Preview2 - Error parsing stored data:', e);
        formData = propFormData || {};
      }
    } else {
      formData = propFormData || {};
    }
  } else {
    // Even if hookFormData has data, preserve profileImage from propFormData if it's from database
    if (propFormData?.profileImage && propFormData.profileImage.data) {
      formData = { ...formData, profileImage: propFormData.profileImage };
    }
    // Merge with propFormData to ensure we have all fields
    formData = { 
      ...(propFormData || {}),
      ...formData,
      profileImage: propFormData?.profileImage || formData?.profileImage,
      customSection: propFormData?.customSection || formData?.customSection || [],
      otherInfo: propFormData?.otherInfo || formData?.otherInfo || []
    };
  }

  // Refresh preview data from form inputs whenever app form data changes
  // Only update if not on preview page (where form is not in DOM)
  useEffect(() => {
    if (!isPreviewPage) {
      updatePreviewData();
    }
  }, [propFormData, updatePreviewData, isPreviewPage]);


  // Ensure dynamic inputs update preview on typing
  useEffect(() => {
    const onInput = (e) => {
      if (e && e.target && e.target.classList && (
        e.target.classList.contains('father-name-input') ||
        e.target.classList.contains('husband-name-input') ||
        e.target.classList.contains('cnic-input') ||
        e.target.classList.contains('dob-input') ||
        e.target.classList.contains('marital-status-input') ||
        e.target.classList.contains('religion-input') ||
        e.target.classList.contains('custom-label-input-field') ||
        e.target.classList.contains('custom-value-input-field')
      )) {
        updatePreviewData();
      }
    };
    document.addEventListener('input', onInput, true);
    return () => document.removeEventListener('input', onInput, true);
  }, [updatePreviewData]);

  // Calculate A4 preview scale for mobile devices
  useEffect(() => {
    const calculateScale = () => {
      if (!showA4Preview) return;
      
      const isMobile = window.innerWidth <= 768;
      if (!isMobile) {
        setA4Scale(1);
        return;
      }

      // A4 dimensions: 800px × 1129px
      const a4Width = 800;
      const a4Height = 1129;
      
      // Available space (accounting for close button ~45px and padding)
      const availableWidth = window.innerWidth - 10; // 5px padding on each side
      const availableHeight = window.innerHeight - 45; // 45px for close button
      
      // Calculate scale to fit both dimensions
      const scaleX = availableWidth / a4Width;
      const scaleY = availableHeight / a4Height;
      
      // Use the smaller scale to ensure it fits both dimensions
      const scale = Math.min(scaleX, scaleY);
      
      // Set a minimum scale to prevent it from being too small
      setA4Scale(Math.max(scale, 0.2));
    };

    calculateScale();
    
    // Recalculate on resize (orientation change, etc.)
    window.addEventListener('resize', calculateScale);
    window.addEventListener('orientationchange', calculateScale);
    
    return () => {
      window.removeEventListener('resize', calculateScale);
      window.removeEventListener('orientationchange', calculateScale);
    };
  }, [showA4Preview]);
  
  // Default sections to show on page load: professional-summary, skills, languages, references
  const displayData = {
    name: formData.name || '',
    position: formData.position || '',
    phone: formData.phone || '',
    email: formData.email || '',
    address: formData.address || '',
    professionalSummary: formData.professionalSummary || 'To work with a organization that offers a creative, dynamic and professional environment, where my education, knowledge, skills and proven abilities can be fully utilized and which also offers learning opportunities for my career development in the long run.',
    education: formData.education && formData.education.length > 0 ? formData.education : [],
    experience: formData.experience && formData.experience.length > 0 ? formData.experience : [],
    skills: Array.isArray(formData.skills) ? formData.skills.filter(skill => skill && skill.trim() !== '') : [],
    certifications: formData.certifications && formData.certifications.length > 0 ? formData.certifications.filter(cert => cert && cert.trim() !== '') : [],
    languages: formData.languages && formData.languages.length > 0 ? formData.languages.filter(lang => lang && lang.trim() !== '') : ['English', 'Urdu', 'Punjabi'],
    hobbies: formData.hobbies && formData.hobbies.length > 0 ? formData.hobbies.filter(hobby => hobby && hobby.trim() !== '') : [],
    otherInfo: formData.otherInfo && formData.otherInfo.length > 0 ? formData.otherInfo.filter(info => info.value && info.value.trim() !== '') : [],
    customSection: formData.customSection && formData.customSection.length > 0 ? formData.customSection : [],
    references: formData.references && formData.references.length > 0 ? formData.references.filter(ref => ref && ref.trim() !== '') : []
  };
  
  // Create local getProfileImageUrl function that uses the merged formData
  const getLocalProfileImageUrl = () => {
    if (formData.profileImage) {
      // If it's a File object, create object URL
      if (formData.profileImage instanceof File) {
        return URL.createObjectURL(formData.profileImage);
      }
      // If it's base64 data from database, use it directly
      if (formData.profileImage.data) {
        return formData.profileImage.data;
      }
      // If it's a string (direct base64 URL), use it directly
      if (typeof formData.profileImage === 'string') {
        return formData.profileImage;
      }
    }
    return null;
  };
  
  const profileImageUrl = getLocalProfileImageUrl();
  const contactInfo = formatContactInfo();
  
  // Debug: Log contact information
  console.log('Template1 - Contact Info:', contactInfo);
  console.log('Template1 - Form Data:', formData);
  console.log('Template1 - Profile Image:', formData.profileImage);
  console.log('Template1 - Profile Image URL:', profileImageUrl);
  console.log('Template1 - Custom Section Data:', displayData.customSection);
  console.log('Template1 - Custom Section Data Details:', displayData.customSection.map((item, index) => ({
    index,
    heading: item.heading,
    detail: item.detail,
    hasHeading: !!item.heading,
    hasDetail: !!item.detail
  })));
  console.log('Template1 - Full Custom Section Array:', JSON.stringify(displayData.customSection, null, 2));
  console.log('Template1 - Individual Items:');
  displayData.customSection.forEach((item, index) => {
    console.log(`Item ${index}:`, {
      heading: item.heading,
      detail: item.detail,
      headingLength: item.heading?.length || 0,
      detailLength: item.detail?.length || 0
    });
  });

  // Render the CV preview content (reusable for both normal and modal view)
  const renderCVContent = () => (
    <>
          {/* Two Column Layout */}
          {/* Left Column - Purple Background */}
          <div className="cv-left-column">
          {/* CV Header - Left Column */}
          <div className="cv-header">
            {/* Profile Image Container */}
            <div className="profile-image-container">
              {profileImageUrl ? (
                <img 
                  src={profileImageUrl} 
                  alt="Profile" 
                  className="profile-image"
                />
              ) : (
                <div className="profile-placeholder">
                  CV
                </div>
              )}
            </div>

            {/* Header Content */}
            <div className="header-content">
              {/* Name */}
              <h1 className="header-name">
                {displayData.name}
              </h1>

              {/* Position/Title */}
              {displayData.position && (
                <h2 className="header-title">
                  {displayData.position}
                </h2>
              )}

              {/* Contact Information */}
              {contactInfo && contactInfo.length > 0 && (
                <div className="header-contact">
                  {contactInfo.map((contact, index) => (
                    <div key={index} className="contact-item">
                      <span className="contact-icon">{contact.icon}</span>
                      <span>{contact.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Skills Section - Left Column */}
          {displayData.skills && displayData.skills.length > 0 && (
            <div className="cv-section left-column">
              <h3 className="section-heading left-column">Skills</h3>
              <div className="section-content">
                <div className="skills-container">
                  {displayData.skills.map((skill, index) => (
                    <div key={index} className="skill-pill">
                      <span className="skill-name">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Other Information Section - Left Column */}
          {displayData.otherInfo && displayData.otherInfo.length > 0 && (
            <div className="cv-section left-column">
              <h3 className="section-heading left-column">Other Information</h3>
              <div className="section-content">
                <div
                  className="other-info-grid"
                  style={{ gridTemplateColumns: '1fr', gridAutoFlow: 'row' }}
                >
                  {displayData.otherInfo.map((info, index) => (
                    <div key={index} className="info-item">
                      <span className="info-label">{info.label}:</span>
                      <span className="info-value">{info.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Languages Section - Left Column */}
          {displayData.languages && displayData.languages.length > 0 && (
            <div className="cv-section left-column">
              <h3 className="section-heading left-column">Languages</h3>
              <div className="section-content">
                <div className="languages-container">
                  {displayData.languages.map((language, index) => (
                    <div key={index} className="language-pill">
                      <span className="language-name">{language}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Hobbies Section - Left Column */}
          {displayData.hobbies && displayData.hobbies.length > 0 && (
            <div className="cv-section left-column">
              <h3 className="section-heading left-column">Hobbies</h3>
              <div className="section-content">
                <div className="hobbies-container">
                  {displayData.hobbies.map((hobby, index) => (
                    <div key={index} className="hobby-pill">
                      <span className="hobby-name">{hobby}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - White Background */}
        <div className="cv-right-column">
          {/* Professional Summary Section - Right Column */}
          <div className="cv-section right-column">
            <h3 className="section-heading right-column">Professional Summary</h3>
            <div className="section-content">
              <p className="professional-summary-text">
                {displayData.professionalSummary}
              </p>
            </div>
          </div>

          {/* Education Section - Right Column */}
          {displayData.education && displayData.education.length > 0 && (
            <div className="cv-section right-column">
              <h3 className="section-heading right-column">Education</h3>
              <div className="section-content">
                {displayData.education.map((edu, index) => (
                  <div key={index} className="education-item">
                    <div className="education-single-line">
                      <span className="education-degree">{edu.degree}</span>
                      {edu.board && <span className="education-board"> • {edu.board}</span>}
                      {edu.year && <span className="education-year"> • {edu.year}</span>}
                      {edu.marks && <span className="education-marks"> • {edu.marks}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Experience Section - Right Column */}
          {displayData.experience && displayData.experience.length > 0 && (
            <div className="cv-section right-column">
              <h3 className="section-heading right-column">Experience</h3>
              <div className="section-content">
                {displayData.experience.map((exp, index) => (
                  <div key={index} className="experience-item">
                    <div className="experience-header">
                      <span className="experience-job-title">{exp.jobTitle || 'No job title'}</span>
                      {exp.duration && <span className="experience-duration">{exp.duration}</span>}
                    </div>
                    {exp.company && (
                      <div className="experience-company-line">
                        <span className="experience-company">{exp.company}</span>
                      </div>
                    )}
                    {exp.jobDetails && (
                      <div className="experience-details">
                        <ul className="experience-details-list">
                          {exp.jobDetails.split('\n').map((detail, detailIndex) => (
                            detail.trim() && (
                              <li key={detailIndex} className="experience-detail-item">
                                {detail.trim()}
                              </li>
                            )
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications Section - Right Column */}
          {displayData.certifications && displayData.certifications.length > 0 && (
            <div className="cv-section right-column">
              <h3 className="section-heading right-column">Certifications</h3>
              <div className="section-content">
                <div className="certifications-content">
                  {displayData.certifications.map((cert, index) => (
                    <div key={index} className="certification-item">
                      <p className="certification-text">{cert}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Custom Section - Right Column */}
          {displayData.customSection && displayData.customSection.length > 0 && displayData.customSection.map((custom, sectionIndex) => {
            // Handle both old format (with 'detail') and new format (with 'details' array)
            const details = custom.details || (custom.detail ? [custom.detail] : []);
            const heading = custom.heading || '';
            
            // Skip sections without heading or details
            if (!heading && details.length === 0) return null;
            
            return (
              <div key={sectionIndex} className="cv-section right-column">
                <h3 className="section-heading right-column">
                  {heading || 'Custom Section'}
                </h3>
                <div className="section-content">
                  <div className="custom-section-content">
                    {details.map((detail, detailIndex) => (
                      detail && (
                        <div key={detailIndex} className="custom-section-item">
                          <p className="custom-section-detail">{detail}</p>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* References Section - Right Column */}
          {displayData.references && displayData.references.length > 0 && (
            <div className="cv-section right-column">
              <h3 className="section-heading right-column">References</h3>
              <div className="section-content">
                <div className="references-content">
                  {displayData.references.map((reference, index) => (
                    <div key={index} className="reference-item">
                      <p className="reference-text">{reference}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Download PDF Button - Right Column */}
          <div className="download-pdf-container">
            <button 
              className="download-pdf-button" 
              onClick={generatePDF}
              title="Download CV as PDF"
            >
              📄 Download PDF
            </button>
        </div>
      </div>
    </>
  );

  // If this is the preview page, render the preview content directly
  if (isPreviewPage) {
    return (
      <div 
        className="template2-root"
        style={{
          width: '800px',
          minWidth: '800px',
          maxWidth: '800px',
          minHeight: '1129px',
          height: 'auto',
          margin: '0 auto',
          padding: '0'
        }}
      >
        <div className="cv-preview a4-size-preview pdf-mode">
          {renderCVContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="right-container template2-container">
      {/* Preview Button - Show on all devices */}
      <div className="preview-controls">
        <button 
          className="preview-a4-button"
          onClick={() => {
            // Capture all form data from DOM, including profile image
            const existingData = propFormData || formData;
            const capturedData = getFormDataFromDOM(existingData);
            console.log('Preview2 - Captured form data from DOM:', capturedData);
            console.log('Preview2 - Profile image captured:', capturedData.profileImage);
            
            // Sync captured data to App.js state if updateFormData is available
            if (updateFormData) {
              updateFormData(capturedData);
              console.log('Preview2 - Synced data to App.js state');
            }
            
            // Store in localStorage for persistence
            try {
              // Create a serializable copy (File objects can't be serialized)
              const serializableData = {
                ...capturedData,
                profileImage: capturedData.profileImage instanceof File 
                  ? null // Can't serialize File objects, but we'll preserve it in state
                  : capturedData.profileImage
              };
              localStorage.setItem('cvFormData', JSON.stringify(serializableData));
              console.log('Preview2 - Stored data in localStorage');
            } catch (e) {
              console.error('Preview2 - Error storing data in localStorage:', e);
            }
            
            // Show A4 preview
            setShowA4Preview(true);
          }}
          title="View A4 Preview"
        >
          📄 View A4 Preview
        </button>
      </div>

      {/* A4 Preview Modal */}
      {showA4Preview && (
        <div className="a4-preview-modal-overlay" onClick={() => setShowA4Preview(false)}>
          <div className="a4-preview-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="a4-preview-close-button"
              onClick={() => setShowA4Preview(false)}
              aria-label="Close Preview"
            >
              ×
            </button>
            <div className="a4-preview-container" ref={a4PreviewRef}>
              <div className="template2-root">
                <div 
                  className="cv-preview a4-size-preview"
                  style={{
                    transform: `scale(${a4Scale})`,
                    transformOrigin: 'center center',
                    width: '800px',
                    minWidth: '800px',
                    maxWidth: '800px',
                    minHeight: '1129px',
                    height: 'auto'
                  }}
                >
                  {renderCVContent()}
                </div>
              </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

export default Preview2;
