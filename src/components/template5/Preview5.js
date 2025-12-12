import React, { useEffect } from 'react';
import usePreviewHandler from './PreviewHandler5';
import generatePDF, { generateCompactPDF } from './pdf5';
import './Preview5.css';

function Preview5({ formData: propFormData, autoSaveStatus, hasUnsavedChanges }) {
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

  return (
    <div className="right-container">
      <div className="cv-preview template5-root europass-cv">
        {/* Europass Header with Logo */}
        <div className="europass-header" style={{ border: 'none', borderBottom: 'none', margin: 0, marginBottom: 0, padding: 0, outline: 'none', boxShadow: 'none' }}>
          <div className="europass-header-content" style={{ border: 'none', borderBottom: 'none', margin: 0, padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <h1 className="europass-title" style={{ margin: 0, padding: 0, fontSize: '24pt' }}>CURRICULUM VITAE</h1>
            {/* Europass Logo - Top Right */}
            <div className="europass-logo-container" style={{ margin: 0, padding: 0 }}>
              <img 
                src="/images/europass-logo.png" 
                alt="Europass" 
                className="europass-logo"
                style={{ height: '120px', maxWidth: '300px', width: 'auto', margin: 0, padding: 0, display: 'block' }}
                onError={(e) => {
                  // Try alternative filename if first one fails
                  if (e.target.src.includes('europass-logo.png') && !e.target.src.includes('.png.png')) {
                    e.target.src = '/images/europass-logo.png.png';
                  } else {
                    console.error('Europass logo failed to load:', e.target.src);
                    e.target.style.display = 'none';
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="europass-section" style={{ marginTop: 0, paddingTop: 0 }}>
          <h2 className="europass-section-title">Personal Information</h2>
          <div className="europass-section-content">
            <div className="europass-field-group">
              {displayData.name && (
                <div className="europass-field">
                  <span className="europass-label">Surname(s) / First name(s):</span>
                  <span className="europass-value">{displayData.name}</span>
                </div>
              )}
              {displayData.address && (
                <div className="europass-field">
                  <span className="europass-label">Address:</span>
                  <span className="europass-value">{displayData.address}</span>
                </div>
              )}
              {displayData.phone && (
                <div className="europass-field">
                  <span className="europass-label">Telephone:</span>
                  <span className="europass-value">{displayData.phone}</span>
                </div>
              )}
              {displayData.email && (
                <div className="europass-field">
                  <span className="europass-label">E-mail:</span>
                  <span className="europass-value">{displayData.email}</span>
                </div>
              )}
              {displayData.otherInfo && displayData.otherInfo.map((info, index) => {
                if (['Date of Birth', 'Nationality', 'Gender'].includes(info.label)) {
                  return (
                    <div key={index} className="europass-field">
                      <span className="europass-label">{info.label}:</span>
                      <span className="europass-value">{info.value}</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>

        {/* Work Experience Section */}
        {displayData.experience && displayData.experience.length > 0 && (
          <div className="europass-section">
            <h2 className="europass-section-title">Work Experience</h2>
            <div className="europass-section-content">
              {displayData.experience.map((exp, index) => (
                <div key={index} className="europass-experience-item">
                  <div className="europass-date-range">
                    {exp.duration || 'Date range'}
                  </div>
                  <div className="europass-experience-details">
                    <div className="europass-job-title">{exp.jobTitle || 'Job title'}</div>
                    {exp.company && (
                      <div className="europass-company">{exp.company}</div>
                    )}
                    {exp.jobDetails && (
                      <div className="europass-job-description">
                        {exp.jobDetails.split('\n').filter(detail => detail.trim()).map((detail, detailIndex) => (
                          <div key={detailIndex} className="europass-description-line">
                            {detail.trim()}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education and Training Section */}
        {displayData.education && displayData.education.length > 0 && (
          <div className="europass-section">
            <h2 className="europass-section-title">Education and Training</h2>
            <div className="europass-section-content">
              {displayData.education.map((edu, index) => (
                <div key={index} className="europass-education-item">
                  <div className="europass-date-range">
                    {edu.year || 'Date range'}
                  </div>
                  <div className="europass-education-details">
                    <div className="europass-degree">{edu.degree || 'Qualification'}</div>
                    {edu.board && (
                      <div className="europass-institution">{edu.board}</div>
                    )}
                    {edu.marks && (
                      <div className="europass-grade">Grade: {edu.marks}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personal Skills Section */}
        <div className="europass-section">
          <h2 className="europass-section-title">Personal Skills</h2>
          <div className="europass-section-content">
            {/* Mother Tongue(s) */}
            {displayData.languages && displayData.languages.length > 0 && (
              <div className="europass-skill-category">
                <div className="europass-skill-label">Mother tongue(s):</div>
                <div className="europass-skill-value">
                  {displayData.languages[0] || 'Not specified'}
                </div>
              </div>
            )}

            {/* Other Language(s) */}
            {displayData.languages && displayData.languages.length > 1 && (
              <div className="europass-skill-category">
                <div className="europass-skill-label">Other language(s):</div>
                <div className="europass-skill-value">
                  {displayData.languages.slice(1).join(', ')}
                </div>
              </div>
            )}

            {/* Communication Skills */}
            {displayData.skills && displayData.skills.length > 0 && (
              <div className="europass-skill-category">
                <div className="europass-skill-label">Communication, interpersonal and organisational skills:</div>
                <div className="europass-skill-value">
                  {displayData.skills.join(', ')}
                </div>
              </div>
            )}

            {/* Job-related Skills */}
            {displayData.certifications && displayData.certifications.length > 0 && (
              <div className="europass-skill-category">
                <div className="europass-skill-label">Job-related skills:</div>
                <div className="europass-skill-value">
                  {displayData.certifications.join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Information Section */}
        {(displayData.professionalSummary || displayData.hobbies || (displayData.otherInfo && displayData.otherInfo.length > 0) || (displayData.customSection && displayData.customSection.length > 0)) && (
          <div className="europass-section">
            <h2 className="europass-section-title">Additional Information</h2>
            <div className="europass-section-content">
              {displayData.professionalSummary && (
                <div className="europass-additional-item">
                  <div className="europass-additional-label">Personal Statement:</div>
                  <div className="europass-additional-value">{displayData.professionalSummary}</div>
                </div>
              )}
              {displayData.hobbies && displayData.hobbies.length > 0 && (
                <div className="europass-additional-item">
                  <div className="europass-additional-label">Interests:</div>
                  <div className="europass-additional-value">{displayData.hobbies.join(', ')}</div>
                </div>
              )}
              {displayData.otherInfo && displayData.otherInfo.filter(info => !['Date of Birth', 'Nationality', 'Gender'].includes(info.label)).map((info, index) => (
                <div key={index} className="europass-additional-item">
                  <div className="europass-additional-label">{info.label}:</div>
                  <div className="europass-additional-value">{info.value}</div>
                </div>
              ))}
              {displayData.customSection && displayData.customSection.map((custom, sectionIndex) => {
                const details = custom.details || (custom.detail ? [custom.detail] : []);
                const heading = custom.heading || '';
                if (!heading && details.length === 0) return null;
                return (
                  <div key={sectionIndex} className="europass-additional-item">
                    <div className="europass-additional-label">{heading || 'Additional Information'}:</div>
                    <div className="europass-additional-value">
                      {details.map((detail, detailIndex) => (
                        <div key={detailIndex}>{detail}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Annexes Section */}
        {displayData.references && displayData.references.length > 0 && (
          <div className="europass-section">
            <h2 className="europass-section-title">Annexes</h2>
            <div className="europass-section-content">
              {displayData.references.map((reference, index) => (
                <div key={index} className="europass-reference-item">
                  {reference}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Download PDF Buttons */}
        <div className="download-pdf-container">
          <button 
            className="download-pdf-button" 
            onClick={generatePDF}
            title="Download CV as PDF (Standard Spacing)"
          >
            📄 Download PDF
          </button>
          <button 
            className="download-pdf-button download-pdf-button-compact" 
            onClick={generateCompactPDF}
            title="Download CV as PDF (Compact Spacing - For CVs with lots of content)"
          >
            📄 Download PDF (Compact)
          </button>
        </div>
      </div>
    </div>
  );
}

export default Preview5;
