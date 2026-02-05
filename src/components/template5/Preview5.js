import React, { useEffect, useState, useRef, useMemo } from 'react';
import usePreviewHandler from './PreviewHandler5';
// eslint-disable-next-line no-unused-vars
import generatePDF from './pdf5';
import { setCVView } from '../../utils/routing';
import './Preview5.css';
import './Preview5.mobile.css';

// Function to capture all form data from DOM (similar to PreviewHandler5.getFormData)
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
    showProfileImage: document.getElementById('show-profile-image-checkbox')?.checked !== false,
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
  const educationGroups = document.querySelectorAll('.education-group');
  const educationData = Array.from(educationGroups).map(group => {
    const degree = group.querySelector('.degree-input')?.value || '';
    const board = group.querySelector('.board-input')?.value || '';
    const year = group.querySelector('.year-input')?.value || '';
    const marks = group.querySelector('.marks-input')?.value || '';
    const details = group.querySelector('.education-details-textarea')?.value || '';
    if (degree.trim() || board.trim() || year.trim() || marks.trim() || details.trim()) {
      return { degree, board, year, marks, details };
    }
    return null;
  }).filter(edu => edu !== null);
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

  // Get languages data - now includes level
  const langInputs = document.querySelectorAll('.languages-section .language-input');
  const langLevelInputs = document.querySelectorAll('.languages-section .language-level-input');
  data.languages = Array.from(langInputs).map((input, index) => {
    const name = input.value.trim();
    const levelInput = langLevelInputs[index];
    const level = levelInput ? levelInput.value.trim() : '';
    if (name) {
      return { name, level };
    }
    return null;
  }).filter(lang => lang !== null);

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

function Preview5({ formData: propFormData, autoSaveStatus, hasUnsavedChanges, selectedTemplate, onTemplateSwitch, isPreviewPage, updateFormData }) {
  const [showA4Preview, setShowA4Preview] = useState(false);
  const [a4Scale, setA4Scale] = useState(1);
  const [userZoom, setUserZoom] = useState(1);
  const [previewPageScale, setPreviewPageScale] = useState(1);
  const a4PreviewRef = useRef(null);
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
        // Preserve profileImage from propFormData if it exists and is from database
        if (propFormData?.profileImage && propFormData.profileImage.data) {
          parsedData.profileImage = propFormData.profileImage;
        } else {
          // If no profileImage in stored data or propFormData, try to get from file input (if form is in DOM)
          if (!parsedData.profileImage && !isPreviewPage) {
            const fileInput = document.getElementById('file-input');
            if (fileInput?.files?.[0]) {
              parsedData.profileImage = fileInput.files[0];
            }
          }
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
    if (propFormData?.profileImage && propFormData.profileImage.data && (!formData.profileImage || !formData.profileImage.data)) {
      formData = { ...formData, profileImage: propFormData.profileImage };
    } else if (!formData.profileImage && !isPreviewPage) {
      // If no profileImage, try to get from file input (if form is in DOM)
      const fileInput = document.getElementById('file-input');
      if (fileInput?.files?.[0]) {
        formData = { ...formData, profileImage: fileInput.files[0] };
      }
    }
  }

  // Refresh preview data from form inputs whenever app form data changes
  // Only update if not on preview page (where form is not in DOM)
  useEffect(() => {
    if (!isPreviewPage) {
      updatePreviewData();
    }
  }, [propFormData, updatePreviewData, isPreviewPage]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        e.target.id === 'professional-summary-textarea' ||
        e.target.id === 'show-profile-image-checkbox'
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

  // Calculate A4 preview scale for all devices (for modal)
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

  // Calculate scale for preview page (when isPreviewPage is true)
  useEffect(() => {
    if (!isPreviewPage) {
      setPreviewPageScale(1);
      return;
    }

    const calculatePreviewPageScale = () => {
      // A4 dimensions: 800px × 1129px
      const a4Width = 800;
      const a4Height = 1129;
      
      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Get header height (sticky header on preview page)
      const header = document.querySelector('.preview-page-header');
      const headerHeight = header ? header.offsetHeight : 200; // Default to 200px if not found
      
      // Determine device type
      const isMobile = viewportWidth < 768;
      const isTablet = viewportWidth >= 768 && viewportWidth <= 1024;
      
      // Calculate available space
      let availableWidth, availableHeight;
      
      if (isMobile) {
        // Mobile: account for header and minimal padding
        // Use viewport width directly since container has overflow: hidden
        availableWidth = viewportWidth;
        availableHeight = viewportHeight - headerHeight; // Header only, no padding needed
      } else if (isTablet) {
        // Tablet: account for header and padding
        availableWidth = viewportWidth - 30; // 15px padding each side
        availableHeight = viewportHeight - headerHeight - 20; // Header + 10px padding top/bottom
      } else {
        // Desktop: more padding
        availableWidth = viewportWidth - 40; // 20px padding each side
        availableHeight = viewportHeight - headerHeight - 40; // Header + 20px padding top/bottom
      }
      
      // Calculate scale to fit
      const scaleX = availableWidth / a4Width;
      const scaleY = availableHeight / a4Height;
      
      // Use smaller scale to ensure it fits completely
      let baseScale = Math.min(scaleX, scaleY);
      
      // Add a small safety margin (2% for tight fit)
      baseScale = baseScale * 0.98;
      
      // Ensure minimum scale but allow it to be smaller than 1.0
      baseScale = Math.max(baseScale, 0.1);
      baseScale = Math.min(baseScale, 1.0);
      
      setPreviewPageScale(baseScale);
    };

    // Calculate with delays to ensure DOM is ready
    calculatePreviewPageScale();
    const timeoutId1 = setTimeout(calculatePreviewPageScale, 100);
    const timeoutId2 = setTimeout(calculatePreviewPageScale, 300);
    
    // Recalculate on resize
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(calculatePreviewPageScale, 150);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(calculatePreviewPageScale, 400);
    });
    
    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [isPreviewPage]);
  
  // Default sections to show on page load: professional-summary, skills, languages, references
  // Ensure all data is properly extracted from formData
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
    languages: Array.isArray(formData?.languages) && formData.languages.length > 0 ? formData.languages.filter(lang => {
      if (!lang) return false;
      if (typeof lang === 'string') {
        return lang.trim() !== '';
      }
      // Handle object format { name, level }
      return lang.name && lang.name.trim() !== '';
    }) : [],
    hobbies: Array.isArray(formData?.hobbies) && formData.hobbies.length > 0 ? formData.hobbies.filter(hobby => hobby && hobby.trim() !== '') : [],
    otherInfo: Array.isArray(formData?.otherInfo) && formData.otherInfo.length > 0 ? formData.otherInfo.filter(info => info && info.value && info.value.trim() !== '') : [],
    customSection: Array.isArray(formData?.customSection) && formData.customSection.length > 0 ? formData.customSection : [],
    references: Array.isArray(formData?.references) && formData.references.length > 0 ? formData.references.filter(ref => ref && ref.trim() !== '') : [],
    showProfileImage: formData?.showProfileImage !== false
  };
  
  
  // Create local getProfileImageUrl function that uses the merged formData
  // Use useMemo to recalculate when formData or propFormData changes
  // Store previous URL for cleanup
  const profileImageUrlRef = useRef(null);
  const profileImageUrl = useMemo(() => {
    // Cleanup previous object URL if it exists
    if (profileImageUrlRef.current) {
      try {
        URL.revokeObjectURL(profileImageUrlRef.current);
      } catch (e) {
        // Ignore errors during cleanup
      }
      profileImageUrlRef.current = null;
    }

    // First check formData (which includes merged data from hook, localStorage, and props)
    if (formData?.profileImage) {
      // If it's a File object, create object URL
      if (formData.profileImage instanceof File) {
        const url = URL.createObjectURL(formData.profileImage);
        profileImageUrlRef.current = url;
        return url;
      }
      // If it's base64 data from database or localStorage, use it directly
      if (formData.profileImage.data) {
        return formData.profileImage.data;
      }
      // If it's a string (direct base64 URL), use it directly
      if (typeof formData.profileImage === 'string') {
        return formData.profileImage;
      }
    }
    // Also check propFormData as fallback
    if (propFormData?.profileImage) {
      if (propFormData.profileImage instanceof File) {
        const url = URL.createObjectURL(propFormData.profileImage);
        profileImageUrlRef.current = url;
        return url;
      }
      if (propFormData.profileImage.data) {
        return propFormData.profileImage.data;
      }
      if (typeof propFormData.profileImage === 'string') {
        return propFormData.profileImage;
      }
    }
    return null;
  }, [formData?.profileImage, propFormData?.profileImage]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (profileImageUrlRef.current) {
        try {
          URL.revokeObjectURL(profileImageUrlRef.current);
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    };
  }, []);
  // eslint-disable-next-line no-unused-vars
  const contactInfo = formatContactInfo();

  // Render the CV preview content (reusable for both normal and modal view)
  const renderCVContent = () => (
    <div className="template5-root">
        {/* CV Header */}
        <div className="template5-cv-header">
          {/* Header Top Section with Profile on Left */}
          <div className="template5-cv-header-top">
            {/* Profile Image Container */}
            {displayData.showProfileImage !== false && (
            <div className="template5-profile-image-container">
              {profileImageUrl ? (
                <img 
                  src={profileImageUrl} 
                  alt="Profile" 
                  className="template5-profile-image"
                />
              ) : (
                <div className="template5-profile-placeholder">
                  <svg viewBox="0 0 64 64" className="template5-default-cv-logo" aria-hidden="true">
                    <rect x="8" y="4" width="48" height="56" rx="4" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <line x1="16" y1="18" x2="48" y2="18" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="16" y1="26" x2="48" y2="26" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="16" y1="34" x2="40" y2="34" stroke="currentColor" strokeWidth="1.5"/>
                    <text x="32" y="52" textAnchor="middle" fontSize="14" fontWeight="700" fill="currentColor" fontFamily="system-ui, sans-serif">CV</text>
                  </svg>
                </div>
              )}
            </div>
            )}

            {/* Header Content */}
            <div className="template5-header-content">
              {/* Name */}
              <h1 className="template5-header-name">
                {displayData.name}
              </h1>

              {/* Position/Title */}
              {displayData.position && (
                <h2 className="template5-header-title">
                  {displayData.position}
                </h2>
              )}

              {/* Contact info */}
              {(displayData.phone || displayData.email || displayData.address) && (
              <div className="template5-contact-wrapper">
              {displayData.phone && (
                <div className="template5-contact-item">
                  <span className="template5-contact-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </span>
                  <span>{displayData.phone}</span>
                </div>
              )}

              {/* Email */}
              {displayData.email && (
                <div className="template5-contact-item">
                  <span className="template5-contact-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </span>
                  <span>{displayData.email}</span>
                </div>
              )}

              {/* Address */}
              {displayData.address && (
                <div className="template5-contact-item">
                  <span className="template5-contact-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </span>
                  <span>{displayData.address}</span>
                </div>
              )}
              </div>
              )}
            </div>
          </div>
        </div>

        {/* Professional Summary Section */}
        <div className="template5-cv-section">
          <h3 className="template5-section-heading">
            <svg className="template5-section-heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Professional Summary
          </h3>
          <div className="template5-section-content template5-professional-summary-wrapper">
            <p className="template5-professional-summary-text">
              {displayData.professionalSummary}
            </p>
          </div>
        </div>

        {/* Education Section */}
        {displayData.education && displayData.education.length > 0 && (
          <div className="template5-cv-section">
            <h3 className="template5-section-heading">
              <svg className="template5-section-heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              Education
            </h3>
            <div className="template5-section-content">
              {displayData.education.map((edu, index) => (
                <div key={index} className="template5-education-item">
                  <div className="template5-education-single-line">
                    <span className="template5-education-degree">{edu.degree}</span>
                    {edu.board && <span className="template5-education-board"> • {edu.board}</span>}
                    {edu.year && <span className="template5-education-year"> • {edu.year}</span>}
                    {edu.marks && <span className="template5-education-marks"> • {edu.marks}</span>}
                  </div>
                  {edu.details && (
                    <ul className="template5-education-details-list">
                      {edu.details.split('\n').map((detail, detailIndex) => (
                        detail.trim() && (
                          <li key={detailIndex} className="template5-education-detail-item">{detail.trim()}</li>
                        )
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience Section */}
        {displayData.experience && displayData.experience.length > 0 && (
          <div className="template5-cv-section">
            <h3 className="template5-section-heading">
              <svg className="template5-section-heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              Experience
            </h3>
            <div className="template5-section-content">
              {displayData.experience.map((exp, index) => (
                <div key={index} className="template5-experience-item">
                  <div className="template5-experience-header">
                    <span className="template5-experience-job-title">{exp.jobTitle || 'No job title'}</span>
                    {exp.duration && <span className="template5-experience-duration">{exp.duration}</span>}
                  </div>
                  {exp.company && (
                    <div className="template5-experience-company-line">
                      <span className="template5-experience-company">{exp.company}</span>
                    </div>
                  )}
                  {exp.jobDetails && (
                    <div className="template5-experience-details">
                      <ul className="template5-experience-details-list">
                        {exp.jobDetails.split('\n').map((detail, detailIndex) => (
                          detail.trim() && (
                            <li key={detailIndex} className="template5-experience-detail-item">
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
          <div className="template5-cv-section">
            <h3 className="template5-section-heading">
              <svg className="template5-section-heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
              Certifications
            </h3>
            <div className="template5-section-content">
              <div className="template5-certifications-content">
                {displayData.certifications.map((cert, index) => (
                  <div key={index} className="template5-certification-item">
                    <p className="template5-certification-text">{cert}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Skills Section */}
        {displayData.skills && displayData.skills.length > 0 && (
          <div className="template5-cv-section">
            <h3 className="template5-section-heading">
              <svg className="template5-section-heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Skills
            </h3>
            <div className="template5-section-content">
              <div className="template5-skills-container">
                {displayData.skills.map((skill, index) => (
                  <div key={index} className="template5-skill-pill">
                    <span className="template5-skill-name">{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Other Information Section */}
        {displayData.otherInfo && displayData.otherInfo.length > 0 && (
          <div className="template5-cv-section">
            <h3 className="template5-section-heading">
              <svg className="template5-section-heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              Other Information
            </h3>
            <div className="template5-section-content">
              <div
                className="template5-other-info-grid"
                style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridAutoFlow: 'row' }}
              >
                {displayData.otherInfo.map((info, index) => (
                  <div key={index} className="template5-info-item">
                    <span className="template5-info-label">{info.label}:</span>
                    <span className="template5-info-value">{info.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}


        {/* Hobbies Section */}
        {displayData.hobbies && displayData.hobbies.length > 0 && (
          <div className="template5-cv-section">
            <h3 className="template5-section-heading">
              <svg className="template5-section-heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              Hobbies
            </h3>
            <div className="template5-section-content">
              <div className="template5-hobbies-container">
                {displayData.hobbies.map((hobby, index) => (
                  <div key={index} className="template5-hobby-pill">
                    <span className="template5-hobby-name">{hobby}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Languages Section */}
        {displayData.languages && displayData.languages.length > 0 && (
          <div className="template5-cv-section">
            <h3 className="template5-section-heading">
              <svg className="template5-section-heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              Languages
            </h3>
            <div className="template5-section-content">
              <div className="template5-languages-container">
                {displayData.languages.map((language, index) => {
                  const languageName = typeof language === 'string' ? language : (language.name || language);
                  const languageLevel = typeof language === 'string' ? '' : (language.level || '');
                  return (
                    <div key={index} className="template5-language-pill">
                      <span className="template5-language-name">{languageName}</span>
                      {languageLevel && (
                        <span className="template5-language-level"> - {languageLevel}</span>
                      )}
                    </div>
                  );
                })}
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
            <div key={sectionIndex} className="template5-cv-section">
              <h3 className="template5-section-heading">
                <svg className="template5-section-heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                {heading || 'Custom Section'}
              </h3>
              <div className="template5-section-content">
                <div className="template5-custom-section-content">
                  {details.map((detail, detailIndex) => (
                    detail && (
                      <div key={detailIndex} className="template5-custom-section-item">
                        <p className="template5-custom-section-detail">{detail}</p>
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
          <div className="template5-cv-section">
            <h3 className="template5-section-heading">
              <svg className="template5-section-heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              References
            </h3>
            <div className="template5-section-content">
              <div className="template5-references-content">
                {displayData.references.map((reference, index) => (
                  <div key={index} className="template5-reference-item">
                    <p className="template5-reference-text">{reference}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
    </div>
  );

  // If this is the preview page, render the preview content directly
  if (isPreviewPage) {
    return (
      <div className="preview-page-preview-wrapper">
        <div 
          className="template5-preview template5-a4-size-preview template5-pdf-mode preview-page-preview"
          style={{
            transform: `scale(${previewPageScale})`,
            transformOrigin: 'top left',
            width: '800px',
            minWidth: '800px',
            maxWidth: '800px',
            minHeight: '1129px',
            height: 'auto',
            margin: 0,
            display: 'block',
            boxSizing: 'border-box',
            background: '#ffffff',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}
        >
          {renderCVContent()}
        </div>
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
            
            // Capture all form data from DOM, preserving profileImage from existing formData if it's from database
            const existingData = propFormData || hookFormData || formData;
            const capturedData = getFormDataFromDOM(existingData);
            console.log('Captured form data from DOM:', capturedData);
            
            // Merge captured data with propFormData to ensure we have all data (especially from database)
            // Prefer propFormData for fields that might not be in DOM (like profileImage from database)
            const mergedData = {
              ...capturedData,
              ...propFormData, // Override with propFormData to preserve database-loaded data
              // But keep captured data for fields that were updated in form
              profileImage: propFormData?.profileImage || capturedData.profileImage,
              // Ensure arrays are preserved from propFormData if they exist
              education: propFormData?.education && propFormData.education.length > 0 
                ? propFormData.education 
                : capturedData.education,
              experience: propFormData?.experience && propFormData.experience.length > 0 
                ? propFormData.experience 
                : capturedData.experience,
              skills: propFormData?.skills && propFormData.skills.length > 0 
                ? propFormData.skills 
                : capturedData.skills,
              certifications: propFormData?.certifications && propFormData.certifications.length > 0 
                ? propFormData.certifications 
                : capturedData.certifications,
              languages: propFormData?.languages && propFormData.languages.length > 0 
                ? propFormData.languages 
                : capturedData.languages,
              hobbies: propFormData?.hobbies && propFormData.hobbies.length > 0 
                ? propFormData.hobbies 
                : capturedData.hobbies,
              otherInfo: propFormData?.otherInfo && propFormData.otherInfo.length > 0 
                ? propFormData.otherInfo 
                : capturedData.otherInfo,
              customSection: propFormData?.customSection && propFormData.customSection.length > 0 
                ? propFormData.customSection 
                : capturedData.customSection,
              references: propFormData?.references && propFormData.references.length > 0 
                ? propFormData.references 
                : capturedData.references
            };
            
            console.log('Merged form data (DOM + propFormData):', mergedData);
            
            // Sync to App.js state if updateFormData is available
            if (updateFormData) {
              updateFormData(mergedData);
              console.log('Synced merged form data to App.js state');
            }
            
            // Always store in localStorage before navigating to preview
            // This ensures data is available when returning from preview
            // Convert File to base64 if needed
            const storeDataWithImage = async () => {
              try {
                let profileImageData = null;
                
                if (mergedData.profileImage) {
                  if (mergedData.profileImage.data) {
                    // Already base64 from database
                    profileImageData = { data: mergedData.profileImage.data };
                  } else if (mergedData.profileImage instanceof File) {
                    // Convert File to base64
                    try {
                      const base64 = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(mergedData.profileImage);
                      });
                      profileImageData = { data: base64 };
                      console.log('Converted profile image to base64');
                    } catch (err) {
                      console.error('Error converting profile image to base64:', err);
                      profileImageData = null;
                    }
                  } else {
                    profileImageData = mergedData.profileImage;
                  }
                }
                
                // Create a serializable copy
                const serializableData = {
                  ...mergedData,
                  profileImage: profileImageData
                };
                localStorage.setItem('cvFormData', JSON.stringify(serializableData));
                console.log('Stored form data in localStorage before navigating to preview');
              } catch (e) {
                console.error('Error storing form data in localStorage:', e);
                // Fallback: store without image
                try {
                  const { profileImage, ...dataWithoutImage } = mergedData;
                  localStorage.setItem('cvFormData', JSON.stringify(dataWithoutImage));
                } catch (e2) {
                  console.error('Error storing form data even without image:', e2);
                }
              }
            };
            
            // Convert and store, then navigate
            storeDataWithImage().then(() => {
              // Small delay to ensure data is synced, then navigate to preview page
              setTimeout(() => {
                setCVView('preview');
                // Ensure selectedApp is set to cv-builder
                localStorage.setItem('selectedApp', 'cv-builder');
                // Another small delay to ensure localStorage is written before reload
                setTimeout(() => {
                  window.location.reload();
                }, 50);
              }, 100);
            });
            
            // Small delay to ensure data is synced, then navigate to preview page
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
      </div>

      {/* A4 Preview Element - Always rendered for PDF generation, hidden when modal is closed */}
      <div 
        className="template5-preview template5-a4-size-preview template5-pdf-mode"
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
                  <option value="template5">Template 5</option>
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
                className="template5-preview template5-a4-size-preview template5-pdf-mode"
                id="a4-preview-content"
                key={`a4-preview-${formData?.name || 'default'}-${Date.now()}`}
                style={{
                  transform: `scale(${isPreviewPage ? (previewPageScale * userZoom) : (a4Scale * userZoom)})`,
                  transformOrigin: isPreviewPage ? 'top center' : 'center center',
                  width: '800px',
                  minWidth: '800px',
                  maxWidth: '800px',
                  minHeight: '1129px',
                  height: 'auto',
                  margin: '0 auto',
                  marginTop: isPreviewPage ? '0' : 'auto',
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

export default Preview5;
