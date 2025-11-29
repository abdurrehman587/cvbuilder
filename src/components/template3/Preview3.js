import React, { useEffect } from 'react';
import usePreviewHandler from './PreviewHandler3';
import generatePDF from './pdf3';
import './Preview3.css';

function Preview3({ formData: propFormData, autoSaveStatus, hasUnsavedChanges }) {
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

  return (
    <div className="right-container">
      <div className="template3-root">
        <div className="cv-preview">
          {/* Header with Graphics */}
          <div className="cv-header">
            <div className="header-graphics">
              <div className="graphic-circle graphic-circle-1"></div>
              <div className="graphic-circle graphic-circle-2"></div>
              <div className="graphic-circle graphic-circle-3"></div>
              <div className="graphic-wave graphic-wave-1"></div>
              <div className="graphic-wave graphic-wave-2"></div>
            </div>
            <div className="header-content-wrapper">
              {/* Profile Image Container - Left Side */}
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

              {/* Right Side Content */}
              <div className="header-right-content">
                {/* Name and Title */}
                <div className="header-text-content">
                  <h1 className="header-name">
                    {displayData.name}
                  </h1>
                  {displayData.position && (
                    <h2 className="header-title">
                      {displayData.position}
                    </h2>
                  )}
                </div>

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
          </div>

          {/* Main Content Area */}
          <div className="cv-main-content">
            {/* Professional Summary Section */}
            <div className="cv-section-card">
              <h3 className="section-heading">Professional Summary</h3>
              <div className="section-content">
                <p className="professional-summary-text">
                  {displayData.professionalSummary}
                </p>
              </div>
            </div>

            {/* Education Section */}
            {displayData.education && displayData.education.length > 0 && (
              <div className="cv-section-card">
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
              <div className="cv-section-card">
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

            {/* Certifications Section */}
            {displayData.certifications && displayData.certifications.length > 0 && (
              <div className="cv-section-card">
                <h3 className="section-heading">Certifications</h3>
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

            {/* Skills Section */}
            {displayData.skills && displayData.skills.length > 0 && (
              <div className="cv-section-card">
                <h3 className="section-heading">Skills</h3>
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

            {/* Other Information Section */}
            {displayData.otherInfo && displayData.otherInfo.length > 0 && (
              <div className="cv-section-card">
                <h3 className="section-heading">Other Information</h3>
                <div className="section-content">
                  <div className="other-info-grid">
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

            {/* Languages Section */}
            {displayData.languages && displayData.languages.length > 0 && (
              <div className="cv-section-card">
                <h3 className="section-heading">Languages</h3>
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

            {/* Hobbies Section */}
            {displayData.hobbies && displayData.hobbies.length > 0 && (
              <div className="cv-section-card">
                <h3 className="section-heading">Hobbies</h3>
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

            {/* Custom Section */}
            {displayData.customSection && displayData.customSection.length > 0 && displayData.customSection.map((custom, sectionIndex) => {
              // Handle both old format (with 'detail') and new format (with 'details' array)
              const details = custom.details || (custom.detail ? [custom.detail] : []);
              const heading = custom.heading || '';
              
              // Skip sections without heading or details
              if (!heading && details.length === 0) return null;
              
              return (
                <div key={sectionIndex} className="cv-section-card">
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

            {/* References Section */}
            {displayData.references && displayData.references.length > 0 && (
              <div className="cv-section-card">
                <h3 className="section-heading">References</h3>
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

            {/* Footer with Graphics */}
            <div className="cv-footer">
              <div className="footer-graphics">
                <div className="footer-graphic-circle footer-graphic-circle-1"></div>
                <div className="footer-graphic-circle footer-graphic-circle-2"></div>
                <div className="footer-graphic-circle footer-graphic-circle-3"></div>
                <div className="footer-wave footer-wave-1"></div>
                <div className="footer-wave footer-wave-2"></div>
                <div className="footer-pattern"></div>
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default Preview3;

