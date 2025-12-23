import React, { useEffect, useState, useRef } from 'react';
import usePreviewHandler from './PreviewHandler1';
import generatePDF from './pdf1';
import { setCVView } from '../../utils/routing';
import './Preview1.css';

// Function to capture all form data from DOM (similar to PreviewHandler1.getFormData)
const getFormDataFromDOM = () => {
  const data = {
    name: document.getElementById('name-input')?.value || '',
    position: document.getElementById('position-input')?.value || '',
    phone: document.getElementById('phone-input')?.value || '',
    email: document.getElementById('email-input')?.value || '',
    address: document.getElementById('address-input')?.value || '',
    profileImage: document.getElementById('file-input')?.files?.[0] || null,
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

  // Get hobbies - need to get from formData state if available, otherwise from DOM
  // For now, we'll get from DOM if available
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

function Preview1({ formData: propFormData, autoSaveStatus, hasUnsavedChanges, selectedTemplate, onTemplateSwitch, isPreviewPage, updateFormData }) {
  const [showA4Preview, setShowA4Preview] = useState(false);
  const [a4Scale, setA4Scale] = useState(1);
  const [userZoom, setUserZoom] = useState(1);
  const a4PreviewRef = useRef(null);
  const { formData: hookFormData, formatContactInfo, updatePreviewData } = usePreviewHandler(propFormData);
  // Use hookFormData as primary source (it merges propFormData with DOM data in PreviewHandler1)
  // This ensures we get all data whether from app state or DOM
  // If hookFormData is empty or doesn't have data, fall back to propFormData
  const formData = (hookFormData && (hookFormData.name || hookFormData.education?.length > 0 || hookFormData.experience?.length > 0)) 
    ? hookFormData 
    : (propFormData || {});
  
  console.log('Preview1 - Final formData:', formData);
  console.log('Preview1 - formData.education:', formData.education);
  console.log('Preview1 - formData.experience:', formData.experience);

  // Refresh preview data from form inputs whenever app form data changes
  useEffect(() => {
    updatePreviewData();
  }, [propFormData, updatePreviewData]);

  // Reset zoom and ensure consistent formatting when CV name changes (switching between CVs)
  // This ensures consistent formatting when switching between different CVs
  useEffect(() => {
    setUserZoom(1);
    // Force a re-render of the preview to ensure all styles are applied consistently
    if (showA4Preview) {
      // Close and reopen to ensure fresh render with new data
      setShowA4Preview(false);
      setTimeout(() => {
        setShowA4Preview(true);
      }, 50);
    }
  }, [propFormData?.name]); // Only trigger when CV name changes (switching CVs)


  // Ensure dynamic inputs update preview on typing
  // Listen to DOM events to catch real-time updates (form might still be in DOM)
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
        e.target.classList.contains('custom-value-input-field') ||
        e.target.classList.contains('degree-input') ||
        e.target.classList.contains('board-input') ||
        e.target.classList.contains('year-input') ||
        e.target.classList.contains('marks-input') ||
        e.target.classList.contains('job-title-input') ||
        e.target.classList.contains('company-input') ||
        e.target.classList.contains('duration-input') ||
        e.target.classList.contains('job-details-textarea') ||
        e.target.id === 'name-input' ||
        e.target.id === 'position-input' ||
        e.target.id === 'phone-input' ||
        e.target.id === 'email-input' ||
        e.target.id === 'address-input' ||
        e.target.id === 'professional-summary-textarea'
      )) {
        updatePreviewData();
      }
    };
    document.addEventListener('input', onInput, true);
    document.addEventListener('change', onInput, true);
    return () => {
      document.removeEventListener('input', onInput, true);
      document.removeEventListener('change', onInput, true);
    };
  }, [updatePreviewData]);

  // Add page break indicators and prevent section cutoff
  useEffect(() => {
    if (!showA4Preview) return;
    
    const updatePageBreaks = () => {
      const previewElement = document.getElementById('a4-preview-content');
      if (!previewElement) return;
      
      // Remove existing page break indicators
      const existingBreaks = previewElement.querySelectorAll('.page-break-indicator');
      existingBreaks.forEach(breakEl => breakEl.remove());
      
      // Remove any existing page break spacers
      const existingSpacers = previewElement.querySelectorAll('.page-break-spacer');
      existingSpacers.forEach(spacer => spacer.remove());
      
      // Reset all sections to their natural position
      const sections = previewElement.querySelectorAll('.cv-section');
      sections.forEach(section => {
        section.style.marginTop = '';
        section.style.pageBreakBefore = '';
        section.style.breakBefore = '';
      });
      
      const pageHeight = 1129; // A4 page height in pixels
      const padding = 20; // Top and bottom padding
      const usablePageHeight = pageHeight - (padding * 2);
      
      // Check each section to see if it would be cut off
      sections.forEach((section, index) => {
        // Get the section's position relative to the preview container
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        
        // Calculate which page this section starts on (accounting for padding)
        const positionOnPage = (sectionTop - padding) % pageHeight;
        const currentPage = Math.floor((sectionTop - padding) / pageHeight);
        
        // Check if section would be cut off (starts too close to page end)
        // Leave at least 10% of page height as buffer
        const minSpaceRequired = usablePageHeight * 0.1;
        const spaceRemaining = pageHeight - positionOnPage - padding;
        const wouldBeCutOff = sectionHeight > spaceRemaining && spaceRemaining < (usablePageHeight - minSpaceRequired);
        
        if (wouldBeCutOff && index > 0) {
          // Move section to next page
          const nextPageStart = (currentPage + 1) * pageHeight + padding;
          const marginNeeded = nextPageStart - sectionTop;
          
          // Only add margin if it's positive (section is before the next page start)
          if (marginNeeded > 0) {
            section.style.marginTop = `${marginNeeded}px`;
            section.style.pageBreakBefore = 'always';
            section.style.breakBefore = 'page';
            section.classList.add('moved-to-next-page');
          }
        } else {
          // Reset if section doesn't need to be moved
          section.style.marginTop = '';
          section.style.pageBreakBefore = '';
          section.style.breakBefore = '';
          section.classList.remove('moved-to-next-page');
        }
      });
      
      // Calculate number of pages needed after adjustments
      const contentHeight = previewElement.scrollHeight;
      const numberOfPages = Math.ceil(contentHeight / pageHeight);
      
      // Add page break indicators for each page after the first
      for (let i = 2; i <= numberOfPages; i++) {
        const breakLine = document.createElement('div');
        breakLine.className = 'page-break-indicator';
        breakLine.style.cssText = `
          position: absolute;
          left: -20px;
          right: -20px;
          top: ${(i - 1) * pageHeight}px;
          height: 3px;
          background: linear-gradient(to right, transparent 0%, #6b7280 10%, #6b7280 90%, transparent 100%);
          pointer-events: none;
          z-index: 10;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        `;
        previewElement.appendChild(breakLine);
      }
    };
    
    // Update page breaks after a short delay to ensure content is rendered
    const timeoutId = setTimeout(updatePageBreaks, 200);
    
    // Also update on window resize and when zoom changes
    window.addEventListener('resize', updatePageBreaks);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updatePageBreaks);
    };
  }, [showA4Preview, formData, userZoom, a4Scale]);

  // Calculate A4 preview scale for all devices
  useEffect(() => {
    if (!showA4Preview) {
      setA4Scale(1);
      setUserZoom(1);
      return;
    }

    const calculateScale = () => {
      // A4 dimensions: 800px × 1129px
      const a4Width = 800;
      const a4Height = 1129;
      
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Determine device type
      const isMobile = viewportWidth < 768;
      const isTablet = viewportWidth >= 768 && viewportWidth <= 1024;
      
      // Simple, reliable calculation based on viewport
      // Account for close button and padding
      let availableWidth, availableHeight;
      
      if (isMobile) {
        // Mobile: modal padding is 5px, close button 50px, download button ~50px
        availableWidth = viewportWidth - 10; // 5px each side
        availableHeight = viewportHeight - 120; // 50px close + 5px top + 5px bottom + 50px button + 10px spacing
      } else if (isTablet) {
        // Tablet: modal padding is 15px sides, 50px top (close), 15px bottom
        // Add extra height buffer for download button (60px) to prevent bottom cutoff
        availableWidth = viewportWidth - 30; // 15px each side
        availableHeight = viewportHeight - 140; // 50px close + 15px top + 15px bottom + 60px button space
      } else {
        // Desktop: modal padding is 20px
        availableWidth = viewportWidth - 80;
        availableHeight = viewportHeight - 120;
      }
      
      // Calculate scale to fit
      const scaleX = availableWidth / a4Width;
      const scaleY = availableHeight / a4Height;
      
      // Use smaller scale with 8% safety margin
      let baseScale = Math.min(scaleX, scaleY) * 0.92;
      
      // Ensure minimum scale
      baseScale = Math.max(baseScale, 0.15);
      baseScale = Math.min(baseScale, 1.0);
      
      // Apply user zoom to the base scale
      const finalScale = baseScale * userZoom;
      setA4Scale(finalScale);
    };

    // Calculate with delays to ensure DOM is ready
    calculateScale();
    const timeoutId1 = setTimeout(calculateScale, 100);
    const timeoutId2 = setTimeout(calculateScale, 300);
    
    // Recalculate on resize
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(calculateScale, 150);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(calculateScale, 400);
    });
    
    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [showA4Preview, userZoom]);
  
  // Default sections to show on page load: professional-summary, skills, languages, references
  // Ensure all data is properly extracted from formData
  // Debug: Log formData to see what we're getting
  console.log('Preview1 - Full formData:', formData);
  console.log('Preview1 - propFormData:', propFormData);
  console.log('Preview1 - hookFormData:', hookFormData);
  
  const displayData = {
    name: formData?.name || '',
    position: formData?.position || '',
    phone: formData?.phone || '',
    email: formData?.email || '',
    address: formData?.address || '',
    professionalSummary: formData?.professionalSummary || 'To work with a organization that offers a creative, dynamic and professional environment, where my education, knowledge, skills and proven abilities can be fully utilized and which also offers learning opportunities for my career development in the long run.',
    education: Array.isArray(formData?.education) && formData.education.length > 0 ? formData.education : [],
    experience: Array.isArray(formData?.experience) && formData.experience.length > 0 ? formData.experience : [],
    skills: Array.isArray(formData?.skills) ? formData.skills.filter(skill => skill && skill.trim() !== '') : [],
    certifications: Array.isArray(formData?.certifications) && formData.certifications.length > 0 ? formData.certifications.filter(cert => cert && cert.trim() !== '') : [],
    languages: Array.isArray(formData?.languages) && formData.languages.length > 0 ? formData.languages.filter(lang => lang && lang.trim() !== '') : [],
    hobbies: Array.isArray(formData?.hobbies) && formData.hobbies.length > 0 ? formData.hobbies.filter(hobby => hobby && hobby.trim() !== '') : [],
    otherInfo: Array.isArray(formData?.otherInfo) && formData.otherInfo.length > 0 ? formData.otherInfo.filter(info => info && info.value && info.value.trim() !== '') : [],
    customSection: Array.isArray(formData?.customSection) && formData.customSection.length > 0 ? formData.customSection : [],
    references: Array.isArray(formData?.references) && formData.references.length > 0 ? formData.references.filter(ref => ref && ref.trim() !== '') : []
  };
  
  console.log('Preview1 - displayData:', displayData);
  
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
        {/* CV Header */}
        <div className="cv-header">
          {/* Header Top Section with Profile on Left */}
          <div className="cv-header-top">
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

              {/* Phone */}
              {displayData.phone && (
                <div className="contact-item">
                  <span className="contact-icon">📞</span>
                  <span>{displayData.phone}</span>
                </div>
              )}

              {/* Email */}
              {displayData.email && (
                <div className="contact-item">
                  <span className="contact-icon">✉️</span>
                  <span>{displayData.email}</span>
                </div>
              )}

              {/* Address */}
              {displayData.address && (
                <div className="contact-item">
                  <span className="contact-icon">📍</span>
                  <span>{displayData.address}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Header Bottom Accent Bar */}
          <div className="cv-header-bottom"></div>
        </div>

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
          <div className="cv-section">
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
          <div className="cv-section">
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
          <div className="cv-section">
            <h3 className="section-heading">Other Information</h3>
            <div className="section-content">
              <div
                className="other-info-grid"
                style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridAutoFlow: 'row' }}
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

        {/* Languages Section */}
        {displayData.languages && displayData.languages.length > 0 && (
          <div className="cv-section">
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
          <div className="cv-section">
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

        {/* References Section */}
        {displayData.references && displayData.references.length > 0 && (
          <div className="cv-section">
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
    </>
  );

  // If this is the preview page, render the preview content directly
  if (isPreviewPage) {
    return (
      <div 
        className="cv-preview a4-size-preview pdf-mode"
        style={{
          width: '800px',
          minWidth: '800px',
          maxWidth: '800px',
          minHeight: '1129px',
          height: 'auto',
          margin: '0 auto',
          display: 'block',
          boxSizing: 'border-box',
          background: '#ffffff',
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
        }}
      >
        {renderCVContent()}
      </div>
    );
  }

  return (
    <>
      {/* Action Buttons - Below Form */}
      <div className="cv-action-buttons">
        <button 
          className="preview-a4-button"
          onClick={async () => {
            console.log('Preview button clicked - capturing form data and syncing to App.js');
            
            // Capture all form data from DOM
            const capturedData = getFormDataFromDOM();
            console.log('Captured form data from DOM:', capturedData);
            
            // Sync to App.js state if updateFormData is available
            if (updateFormData) {
              updateFormData(capturedData);
              console.log('Synced form data to App.js state');
            } else {
              // Fallback: Store in localStorage
              localStorage.setItem('cvFormData', JSON.stringify(capturedData));
              console.log('Stored form data in localStorage');
            }
            
            // Small delay to ensure data is synced
            setTimeout(() => {
              setCVView('preview');
              // Ensure selectedApp is set to cv-builder
              localStorage.setItem('selectedApp', 'cv-builder');
              // Another small delay to ensure localStorage is written before reload
              setTimeout(() => {
                window.location.reload();
              }, 50);
            }, 100);
          }}
          title="View A4 Preview"
        >
          📄 View A4 Preview
        </button>
          <button 
          className="download-pdf-button-main"
            onClick={generatePDF}
            title="Download CV as PDF"
          >
          📥 Download PDF
          </button>
      </div>

      {/* A4 Preview Element - Always rendered for PDF generation, hidden when modal is closed */}
      <div 
        className="cv-preview a4-size-preview pdf-mode"
        style={{
          display: 'none', // Hidden but in DOM for PDF generation
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          visibility: 'hidden',
          transform: 'scale(1)',
          transformOrigin: 'center center',
          width: '800px',
          minWidth: '800px',
          maxWidth: '800px',
          minHeight: '1129px',
          height: 'auto',
          margin: '0 auto',
          boxSizing: 'border-box',
          zIndex: -1,
          background: '#ffffff',
          padding: '20px'
        }}
      >
        {renderCVContent()}
      </div>

      {/* A4 Preview Modal */}
      {showA4Preview && (
        <div className="a4-preview-modal-overlay" onClick={() => setShowA4Preview(false)}>
          <div className="a4-preview-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="a4-preview-close-button"
              onClick={(e) => {
                e.stopPropagation();
                setShowA4Preview(false);
              }}
              aria-label="Close Preview"
              title="Close Preview"
            >
              ×
            </button>
            
            {/* Template Switcher */}
            {onTemplateSwitch && (
              <div className="a4-preview-template-switcher">
                <label className="template-switcher-label">Template:</label>
                <select 
                  className="template-switcher-select"
                  value={selectedTemplate || 'template1'}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (onTemplateSwitch) {
                      onTemplateSwitch(e.target.value);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  title="Switch Template"
                >
                  <option value="template1">Template 1</option>
                  <option value="template2">Template 2</option>
                  <option value="template3">Template 3</option>
                  <option value="template4">Template 4</option>
                  <option value="template5">Template 5 (Europass)</option>
                </select>
              </div>
            )}
            
            {/* Zoom Controls */}
            <div className="a4-preview-zoom-controls">
              <button 
                className="zoom-button zoom-out"
                onClick={(e) => {
                  e.stopPropagation();
                  setUserZoom(prev => Math.max(0.5, prev - 0.1));
                }}
                title="Zoom Out"
                aria-label="Zoom Out"
              >
                −
              </button>
              <span className="zoom-level">{Math.round(userZoom * 100)}%</span>
              <button 
                className="zoom-button zoom-in"
                onClick={(e) => {
                  e.stopPropagation();
                  setUserZoom(prev => Math.min(2.0, prev + 0.1));
                }}
                title="Zoom In"
                aria-label="Zoom In"
              >
                +
              </button>
              <button 
                className="zoom-button zoom-reset"
                onClick={(e) => {
                  e.stopPropagation();
                  setUserZoom(1);
                }}
                title="Reset Zoom"
                aria-label="Reset Zoom"
              >
                ↻
              </button>
            </div>
            
            <div className="a4-preview-container" ref={a4PreviewRef}>
              <div 
                className="cv-preview a4-size-preview pdf-mode"
                id="a4-preview-content"
                key={`a4-preview-${formData?.name || 'default'}-${Date.now()}`}
                style={{
                  transform: `scale(${a4Scale * userZoom})`,
                  transformOrigin: 'center center',
                  width: '800px',
                  minWidth: '800px',
                  maxWidth: '800px',
                  minHeight: '1129px',
                  height: 'auto',
                  margin: '0 auto',
                  display: 'block',
                  boxSizing: 'border-box'
                }}
                data-page-height="1129"
              >
                {renderCVContent()}
              </div>
        </div>
      </div>
    </div>
      )}
    </>
  );
}

export default Preview1;
