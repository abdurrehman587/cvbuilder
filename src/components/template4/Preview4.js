import React, { useEffect, useState, useRef } from 'react';
import usePreviewHandler from './PreviewHandler4';
import generatePDF from './pdf4';
import './Preview4.css';

function Preview4({ formData: propFormData, autoSaveStatus, hasUnsavedChanges }) {
  const [showA4Preview, setShowA4Preview] = useState(false);
  const [a4Scale, setA4Scale] = useState(1);
  const a4PreviewRef = useRef(null);
  const { formData: hookFormData, formatContactInfo, updatePreviewData } = usePreviewHandler(propFormData);
  // Use propFormData as primary source (from app state/database) and merge with hook data for DOM-only fields
  const formData = { 
    ...(propFormData || {}),
    ...(hookFormData || {}),
    profileImage: propFormData?.profileImage || hookFormData?.profileImage,
    // Ensure customSection comes from propFormData (app state) not DOM
    customSection: propFormData?.customSection || hookFormData?.customSection || []
  };

  // Refresh preview data from form inputs whenever app form data changes
  useEffect(() => {
    updatePreviewData();
  }, [propFormData, updatePreviewData]);


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
        {/* CV Header - Full Width */}
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

        {/* Two Column Layout */}
        <div className="cv-content-grid">
          {/* Left Column */}
          <div className="cv-left-column">
            {/* Skills Section */}
            {displayData.skills && displayData.skills.length > 0 && (
              <div className="cv-section">
                <h3 className="section-heading">Skills</h3>
                <div className="section-content">
                  <div className="skills-content">
                    {displayData.skills.map((skill, index) => (
                      <div key={index} className="skill-item">
                        {skill}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Languages Section */}
            {displayData.languages && displayData.languages.length > 0 && (
              <div className="cv-section">
                <h3 className="section-heading">Languages</h3>
                <div className="section-content">
                  <div className="languages-content">
                    {displayData.languages.map((language, index) => (
                      <div key={index} className="language-item">
                        {language}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Hobbies Section */}
            {displayData.hobbies && displayData.hobbies.length > 0 && (
              <div className="cv-section">
                <h3 className="section-heading">Hobbies</h3>
                <div className="section-content">
                  <div className="hobbies-content">
                    {displayData.hobbies.map((hobby, index) => (
                      <div key={index} className="hobby-item">
                        {hobby}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Other Information Section */}
            {displayData.otherInfo && displayData.otherInfo.length > 0 && (
              <div className="cv-section">
                <h3 className="section-heading">Other Information</h3>
                <div className="section-content">
                  <div className="other-info-content">
                    {displayData.otherInfo.map((info, index) => (
                      <div key={index} className="other-info-item">
                        <span className="other-info-label">{info.label}:</span>
                        <span className="other-info-value">{info.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Certifications Section */}
            {displayData.certifications && displayData.certifications.length > 0 && (
              <div className="cv-section">
                <h3 className="section-heading">Certifications</h3>
                <div className="section-content">
                  <div className="certifications-content">
                    {displayData.certifications.map((cert, index) => (
                      <div key={index} className="certification-item">
                        {cert}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* References Section */}
            {displayData.references && displayData.references.length > 0 && (
              <div className="cv-section">
                <h3 className="section-heading">References</h3>
                <div className="section-content">
                  <div className="references-content">
                    {displayData.references.map((reference, index) => (
                      <div key={index} className="reference-item">
                        {reference}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="cv-right-column">
            {/* Professional Summary Section */}
            <div className="cv-section">
              <h3 className="section-heading">Professional Summary</h3>
              <div className="section-content">
                <p className="professional-summary-text">
                  {displayData.professionalSummary}
                </p>
              </div>
            </div>

            {/* Education Section */}
            {displayData.education && displayData.education.length > 0 && (
              <div className="cv-section">
                <h3 className="section-heading">Education</h3>
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

            {/* Experience Section */}
            {displayData.experience && displayData.experience.length > 0 && (
              <div className="cv-section">
                <h3 className="section-heading">Experience</h3>
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
                          <div className="experience-details-list">
                            {exp.jobDetails.split('\n').filter(detail => detail.trim()).map((detail, detailIndex, array) => (
                              <span key={detailIndex} className="experience-detail-item">
                                {detail.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Section */}
            {displayData.customSection && displayData.customSection.length > 0 && displayData.customSection.map((custom, sectionIndex) => {
              // Handle both old format (with 'detail') and new format (with 'details' array)
              const details = custom.details || (custom.detail ? [custom.detail] : []);
              const heading = custom.heading || '';
              
              // Skip sections without heading or details
              if (!heading && details.length === 0) return null;
              
              return (
                <div key={sectionIndex} className="cv-section">
                  <h3 className="section-heading">
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
          </div>
        </div>

        {/* Download PDF Button */}
        <div className="download-pdf-container">
          <button 
            className="download-pdf-button" 
            onClick={generatePDF}
            title="Download CV as PDF"
          >
            📄 Download PDF
          </button>
        </div>
    </>
  );

  return (
    <div className="right-container template4-container">
      {/* Preview Button - Show on all devices */}
      <div className="preview-controls">
        <button 
          className="preview-a4-button"
          onClick={() => setShowA4Preview(true)}
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
              <div 
                className="cv-preview template4-root a4-size-preview"
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
      )}
    </div>
  );
}

export default Preview4;
