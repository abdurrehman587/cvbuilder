import React, { useEffect, useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import usePreviewHandler from './PreviewHandler5';
import generatePDF, { generateCompactPDF } from './pdf5';
import './Preview5.css';

function Preview5({ formData: propFormData, autoSaveStatus, hasUnsavedChanges, isPreviewPage }) {
  const { formData: hookFormData, formatContactInfo, updatePreviewData } = usePreviewHandler(propFormData);
  
  // Use hookFormData as primary source (it merges propFormData with DOM data in PreviewHandler5)
  // This ensures we get all data whether from app state or DOM
  // If hookFormData is empty or doesn't have data, check localStorage and propFormData
  let formData = hookFormData;
  
  // If hookFormData is empty, try localStorage
  if (!formData || (!formData.name && !formData.education?.length && !formData.experience?.length)) {
    const storedData = localStorage.getItem('cvFormData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        console.log('Preview5 - Using stored data from localStorage:', parsedData);
        // Preserve profileImage from propFormData if it exists and is from database
        if (propFormData?.profileImage && propFormData.profileImage.data) {
          parsedData.profileImage = propFormData.profileImage;
          console.log('Preview5 - Preserved profileImage from propFormData:', parsedData.profileImage);
        }
        formData = parsedData;
      } catch (e) {
        console.error('Preview5 - Error parsing stored data:', e);
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

  // State for image rendering
  const [previewImage, setPreviewImage] = useState(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const previewRef = useRef(null);
  
  // State for dragging in preview
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, initialMargin: 0 });
  const [dragPosition, setDragPosition] = useState({
    marginRight: formData.headerRightMargin !== undefined ? formData.headerRightMargin : 20
  });

  // Refresh preview data from form inputs whenever app form data changes
  useEffect(() => {
    updatePreviewData();
    // Update drag position when formData changes
    setDragPosition({
      marginRight: formData.headerRightMargin !== undefined ? formData.headerRightMargin : 20
    });
  }, [propFormData, updatePreviewData, formData.headerRightMargin]);
  
  // Drag handlers for preview
  const handlePreviewMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      initialMargin: dragPosition.marginRight
    });
  };
  
  const handlePreviewMouseMove = (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    // Negative deltaX (moving left) = more negative margin
    const newMarginRight = dragStart.initialMargin - deltaX;
    // Clamp between -50 and 50
    const clampedMargin = Math.max(-50, Math.min(50, newMarginRight));
    
    setDragPosition({ marginRight: clampedMargin });
  };
  
  const handlePreviewMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      // Update formData by triggering input change on hidden slider
      const marginInput = document.getElementById('header-margin-right');
      if (marginInput) {
        marginInput.value = Math.round(dragPosition.marginRight);
        marginInput.dispatchEvent(new Event('input', { bubbles: true }));
        marginInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  };
  
  // Global mouse and touch event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      const handleMove = (e) => handlePreviewMouseMove(e);
      const handleTouchMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        if (touch) {
          handlePreviewMouseMove({ clientX: touch.clientX, touches: [touch] });
        }
      };
      const handleUp = () => handlePreviewMouseUp();
      
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('mouseup', handleUp);
      document.addEventListener('touchend', handleUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      document.body.style.touchAction = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('mouseup', handleUp);
        document.removeEventListener('touchend', handleUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.body.style.touchAction = '';
      };
    }
  }, [isDragging, dragStart, dragPosition]);

  // Generate preview as image (no longer needed - using HTML preview directly)
  const generatePreviewImage = async () => {
    // Image generation removed - using HTML preview directly
    // This function is kept for compatibility but does nothing
    return;
  };

  // No need to generate preview image for display - using HTML directly
  // Image generation only needed for PDF export

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
      {/* Hidden HTML preview for image generation */}
      <div 
        ref={previewRef}
        className="cv-preview template5-root europass-cv"
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', visibility: 'visible', opacity: 1 }}
      >
        {/* Europass Header - Redesigned */}
        <div className="europass-header" style={{ border: 'none', borderBottom: 'none', margin: 0, marginBottom: 0, padding: 0, outline: 'none', boxShadow: 'none', width: '100%', overflow: 'visible' }}>
          <div className="europass-header-content" style={{ border: 'none', borderBottom: 'none', margin: 0, padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '15px', overflow: 'visible' }}>
            {/* Left Side - Curriculum Vitae Title */}
            <h1 className="europass-title" style={{ margin: 0, padding: 0, fontSize: '40pt', flex: '0 0 auto' }}>CURRICULUM VITAE</h1>
            
            {/* Right Side - Profile Image (if uploaded) and Logo - Hidden in preview image, shown in draggable overlay */}
            <div className="europass-header-right" style={{ display: 'none', visibility: 'hidden', opacity: 0 }}>
              {/* Profile Image - Only show if uploaded */}
              {profileImageUrl && (
                <div className="europass-profile-image-container" style={{ display: 'none', visibility: 'hidden', opacity: 0 }}>
                  <img 
                    src={profileImageUrl} 
                    alt="Profile" 
                    className="europass-profile-image"
                    style={{ display: 'none', visibility: 'hidden', opacity: 0 }}
                  />
                </div>
              )}
              
              {/* Europass Logo */}
              <div className="europass-logo-container" style={{ display: 'none', visibility: 'hidden', opacity: 0 }}>
                <img 
                  src="/images/europass-logo.png.png" 
                  alt="Europass" 
                  className="europass-logo"
                  style={{ display: 'none', visibility: 'hidden', opacity: 0 }}
                  onError={(e) => {
                    // Try alternative filename if first one fails
                    if (e.target.src.includes('europass-logo.png.png')) {
                      e.target.src = '/images/europass-logo.png';
                    } else {
                      console.error('Europass logo failed to load:', e.target.src);
                      console.warn('Logo image not found, but keeping placeholder');
                    }
                  }}
                />
              </div>
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
              {displayData.position && (
                <div className="europass-field">
                  <span className="europass-label">Position/Title:</span>
                  <span className="europass-value">{displayData.position}</span>
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
            {/* Communication Skills */}
            {displayData.skills && displayData.skills.length > 0 && (
              <div className="europass-skill-category">
                <div className="europass-skill-value">
                  {displayData.skills.join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Languages Section */}
        {displayData.languages && displayData.languages.length > 0 && (
          <div className="europass-section">
            <h2 className="europass-section-title">Languages</h2>
            <div className="europass-section-content">
              {/* Mother Tongue(s) */}
              {displayData.languages.length > 0 && (
                <div className="europass-language-category">
                  <div className="europass-language-label">Mother tongue(s):</div>
                  <div className="europass-language-value">
                    {displayData.languages[0] || 'Not specified'}
                  </div>
                </div>
              )}

              {/* Other Language(s) */}
              {displayData.languages.length > 1 && (
                <div className="europass-language-category">
                  <div className="europass-language-label">Other language(s):</div>
                  <div className="europass-language-value">
                    {displayData.languages.slice(1).join(', ')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Certifications Section */}
        {displayData.certifications && displayData.certifications.length > 0 && (
          <div className="europass-section">
            <h2 className="europass-section-title">Certifications</h2>
            <div className="europass-section-content">
              {displayData.certifications.map((cert, index) => (
                <div key={index} className="europass-certification-item">
                  <div className="europass-certification-name">{cert}</div>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Download PDF Buttons - Hidden from image preview */}
        <div className="download-pdf-container" style={{ display: 'none' }}>
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

      {/* Display as responsive HTML preview - scales like an image without format changes */}
      <div className="preview-container-responsive">
        <div 
          className="cv-preview-responsive-wrapper"
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '10px',
            boxSizing: 'border-box',
            overflow: 'auto',
          }}
        >
          {/* Visible HTML Preview - scales proportionally like an image */}
          <div 
            ref={previewRef}
            className="cv-preview template5-root europass-cv cv-preview-visible"
            style={{ 
              position: 'relative',
              visibility: 'visible',
              opacity: 1,
              left: 'auto',
              top: 'auto'
            }}
          >
            {/* Europass Header - Redesigned */}
            <div className="europass-header" style={{ border: 'none', borderBottom: 'none', margin: 0, marginBottom: 0, padding: 0, outline: 'none', boxShadow: 'none', width: '100%', overflow: 'visible' }}>
              <div className="europass-header-content" style={{ border: 'none', borderBottom: 'none', margin: 0, padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '15px', overflow: 'visible' }}>
                {/* Left Side - Curriculum Vitae Title */}
                <h1 className="europass-title" style={{ margin: 0, padding: 0, fontSize: '40pt', flex: '0 0 auto' }}>CURRICULUM VITAE</h1>
                
                {/* Right Side - Profile Image (if uploaded) and Logo - Draggable */}
                <div 
                  className="europass-header-right draggable-header-element"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: `${formData.headerGap !== undefined ? formData.headerGap : 6}px`, 
                    flexShrink: 1, 
                    overflow: 'visible', 
                    visibility: 'visible', 
                    opacity: 1, 
                    marginLeft: 'auto', 
                    marginRight: `${formData.headerRightMargin !== undefined ? formData.headerRightMargin : 20}px`,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    userSelect: 'none',
                    position: 'relative',
                    zIndex: 10
                  }}
                  onMouseDown={handlePreviewMouseDown}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    handlePreviewMouseDown({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {}, stopPropagation: () => {} });
                  }}
                >
                  {/* Profile Image - Only show if uploaded */}
                  {profileImageUrl && (
                    <div className="europass-profile-image-container" style={{ width: '85px', height: '85px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #003399', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, visibility: 'visible', opacity: isDragging ? 0.8 : 1, boxSizing: 'border-box' }}>
                      <img 
                        src={profileImageUrl} 
                        alt="Profile" 
                        className="europass-profile-image"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', visibility: 'visible', opacity: 1 }}
                        draggable="false"
                      />
                    </div>
                  )}
                  
                  {/* Europass Logo */}
                  <div className="europass-logo-container" style={{ margin: 0, padding: 0, width: '260px', maxWidth: '260px', minWidth: '90px', flexShrink: 1, display: 'flex', visibility: 'visible', opacity: isDragging ? 0.8 : 1, overflow: 'visible', alignItems: 'center', justifyContent: 'center' }}>
                    <img 
                      src="/images/europass-logo.png.png" 
                      alt="Europass" 
                      className="europass-logo"
                      style={{ height: '105px', width: '260px', maxWidth: '100%', margin: 0, padding: 0, display: 'block', objectFit: 'contain', visibility: 'visible', opacity: 1, overflow: 'visible' }}
                      draggable="false"
                      onError={(e) => {
                        if (e.target.src.includes('europass-logo.png.png')) {
                          e.target.src = '/images/europass-logo.png';
                        } else {
                          console.error('Europass logo failed to load:', e.target.src);
                          console.warn('Logo image not found, but keeping placeholder');
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Rest of CV content - render the same as hidden preview */}
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
                  {displayData.position && (
                    <div className="europass-field">
                      <span className="europass-label">Position/Title:</span>
                      <span className="europass-value">{displayData.position}</span>
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
                      <div className="europass-experience-header">
                        <span className="europass-experience-duration">{exp.duration || ''}</span>
                        <div className="europass-experience-details">
                          <div className="europass-experience-job-title">{exp.jobTitle || ''}</div>
                          <div className="europass-experience-company">{exp.company || ''}</div>
                        </div>
                      </div>
                      {exp.jobDetails && (
                        <div className="europass-job-description">{exp.jobDetails}</div>
                      )}
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
                {/* Communication Skills */}
                {displayData.skills && displayData.skills.length > 0 && (
                  <div className="europass-skill-category">
                    <div className="europass-skill-value">
                      {displayData.skills.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Languages Section */}
            {displayData.languages && displayData.languages.length > 0 && (
              <div className="europass-section">
                <h2 className="europass-section-title">Languages</h2>
                <div className="europass-section-content">
                  {/* Mother Tongue(s) */}
                  {displayData.languages.length > 0 && (
                    <div className="europass-language-category">
                      <div className="europass-language-label">Mother tongue(s):</div>
                      <div className="europass-language-value">
                        {displayData.languages[0] || 'Not specified'}
                      </div>
                    </div>
                  )}

                  {/* Other Language(s) */}
                  {displayData.languages.length > 1 && (
                    <div className="europass-language-category">
                      <div className="europass-language-label">Other language(s):</div>
                      <div className="europass-language-value">
                        {displayData.languages.slice(1).join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Certifications Section */}
            {displayData.certifications && displayData.certifications.length > 0 && (
              <div className="europass-section">
                <h2 className="europass-section-title">Certifications</h2>
                <div className="europass-section-content">
                  {displayData.certifications.map((cert, index) => (
                    <div key={index} className="europass-certification-item">
                      <div className="europass-certification-name">{cert}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
          </div>
        </div>
        
        {/* Visible PDF Download Buttons */}
        <div className="download-pdf-container-visible">
          <button 
            className="download-pdf-button" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              generatePDF();
            }}
            title="Download CV as PDF (Standard Spacing)"
          >
            📄 Download PDF
          </button>
          <button 
            className="download-pdf-button download-pdf-button-compact" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              generateCompactPDF();
            }}
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
